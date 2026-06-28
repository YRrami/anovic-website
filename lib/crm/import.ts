import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

export type LeadImportRow = Record<string, unknown>;

type ImportField = "lead_id" | "contact_name" | "company_name" | "category" | "email" | "phone" | "website" | "source" | "status" | "priority" | "estimated_value" | "summary";

const stages = new Set(["new", "contacted", "qualified", "proposal", "negotiation", "lost"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const aliases: Record<ImportField, string[]> = {
  lead_id: ["lead id", "lead number", "reference id", "external id", "record id", "id"],
  contact_name: ["contact name", "lead name", "client name", "customer name", "prospect name", "full name", "contact person", "customer", "client", "lead", "name", "person", "اسم العميل", "اسم الشخص", "الاسم", "العميل"],
  company_name: ["company name", "client company", "related company", "associated company", "company related", "business name", "organization", "organisation", "employer", "business", "brand", "firm", "company", "اسم الشركة", "الشركة"],
  category: ["lead category", "business category", "service category", "category", "catagory", "catageroy", "categorie", "industry", "sector", "business type", "service type", "service", "type", "التصنيف", "الفئة", "المجال", "الخدمة"],
  email: ["email address", "contact email", "client email", "customer email", "e mail", "e-mail", "email", "mail", "البريد الالكتروني", "البريد الإلكتروني", "ايميل"],
  phone: ["phone number", "mobile number", "contact number", "client number", "customer number", "telephone number", "whatsapp number", "phone no", "mobile no", "phone", "mobile", "telephone", "whatsapp", "tel", "number", "رقم الهاتف", "رقم الموبايل", "رقم العميل", "الهاتف", "الموبايل"],
  website: ["website url", "company website", "web site", "website", "site", "url", "link", "الموقع الالكتروني", "الموقع"],
  source: ["lead source", "acquisition source", "marketing channel", "campaign", "channel", "origin", "source", "مصدر العميل", "المصدر"],
  status: ["lead status", "pipeline stage", "lead stage", "status", "stage", "الحالة", "المرحلة"],
  priority: ["lead priority", "importance", "priority", "الأولوية"],
  estimated_value: ["expected value", "estimated value", "deal value", "lead value", "potential value", "expected revenue", "budget", "amount", "price", "value", "القيمة المتوقعة", "الميزانية", "القيمة", "السعر"],
  summary: ["lead notes", "requirements", "description", "comments", "comment", "message", "details", "summary", "notes", "note", "ملاحظات", "التفاصيل", "الوصف"],
};

function normalizeLabel(input: unknown) {
  return String(input ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

function levenshtein(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length];
}

function headerScore(rawHeader: unknown, field: ImportField) {
  const header = normalizeLabel(rawHeader);
  if (!header) return 0;
  let best = 0;
  for (const rawAlias of aliases[field]) {
    const alias = normalizeLabel(rawAlias);
    if (header === alias) return 100;
    if (header.includes(alias) || alias.includes(header)) best = Math.max(best, Math.min(header.length, alias.length) >= 4 ? 91 : 72);
    const distance = levenshtein(header, alias);
    const similarity = 1 - distance / Math.max(header.length, alias.length);
    best = Math.max(best, Math.round(similarity * 100));
  }
  return best;
}

function headerMapping(row: unknown[]) {
  const candidates: Array<{ index: number; field: ImportField; score: number }> = [];
  row.forEach((cell, index) => {
    (Object.keys(aliases) as ImportField[]).forEach((field) => {
      const score = headerScore(cell, field);
      if (score >= 74) candidates.push({ index, field, score });
    });
  });
  candidates.sort((a, b) => b.score - a.score);
  const mapping = new Map<number, ImportField>();
  const usedFields = new Set<ImportField>();
  for (const candidate of candidates) {
    if (!mapping.has(candidate.index) && !usedFields.has(candidate.field)) {
      mapping.set(candidate.index, candidate.field);
      usedFields.add(candidate.field);
    }
  }
  return { mapping, score: [...mapping.keys()].reduce((total, index) => total + (candidates.find((item) => item.index === index && item.field === mapping.get(index))?.score || 0), 0) };
}

function cellText(value: unknown) {
  return String(value ?? "").trim();
}

function embeddedEmail(input: string) {
  return input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || "";
}

function embeddedPhone(input: string) {
  const match = input.match(/(?:\+?\d[\d\s().-]{5,}\d)/)?.[0] || "";
  const normalized = match.replace(/(?!^)\+/g, "").replace(/[^0-9+]/g, "");
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 16 ? normalized : "";
}

function embeddedWebsite(input: string) {
  const match = input.match(/(?:https?:\/\/|www\.)[^\s,;]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|eg)(?:\/[^\s,;]*)?/i)?.[0] || "";
  if (!match) return "";
  return (/^https?:\/\//i.test(match) ? match : `https://${match}`).slice(0, 300);
}

function looksLikePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  return Boolean(embeddedPhone(input)) && (/[+()\s-]/.test(input) || /^0/.test(input) || digits.length >= 9);
}

function looksLikeName(input: string) {
  if (!input || input.length > 120 || embeddedEmail(input) || embeddedWebsite(input) || looksLikePhone(input)) return false;
  const letters = (input.match(/\p{L}/gu) || []).length;
  const words = input.trim().split(/\s+/).length;
  return letters >= 2 && letters / input.length >= 0.55 && words <= 7;
}

function inferColumns(matrix: unknown[][], mapping: Map<number, ImportField>) {
  const sample = matrix.slice(0, 60);
  const width = Math.max(0, ...sample.map((row) => row.length));
  const usedFields = new Set(mapping.values());
  const addBest = (field: ImportField, scorer: (value: string) => boolean, minimumRatio: number) => {
    if (usedFields.has(field)) return;
    let best: { index: number; ratio: number } | null = null;
    for (let index = 0; index < width; index += 1) {
      if (mapping.has(index)) continue;
      const values = sample.map((row) => cellText(row[index])).filter(Boolean);
      if (!values.length) continue;
      const ratio = values.filter(scorer).length / values.length;
      if (ratio >= minimumRatio && (!best || ratio > best.ratio)) best = { index, ratio };
    }
    if (best) { mapping.set(best.index, field); usedFields.add(field); }
  };
  addBest("email", (item) => Boolean(embeddedEmail(item)), 0.35);
  addBest("website", (item) => Boolean(embeddedWebsite(item)), 0.5);
  addBest("phone", looksLikePhone, 0.45);
  addBest("status", (item) => stages.has(normalizeLabel(item).replace(/ /g, "_")), 0.6);
  addBest("priority", (item) => priorities.has(normalizeLabel(item)), 0.6);
  addBest("contact_name", looksLikeName, 0.55);
  return mapping;
}

export function parseTabularRows(inputRows: unknown[][]): LeadImportRow[] {
  const rows = inputRows.map((row) => row.map(cellText));
  const populated = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.some(Boolean));
  if (!populated.length) return [];

  let bestHeader: { index: number; mapping: Map<number, ImportField>; score: number } | null = null;
  for (const candidate of populated.slice(0, 30)) {
    const detected = headerMapping(candidate.row);
    if (detected.mapping.size >= 2 && (!bestHeader || detected.score > bestHeader.score)) bestHeader = { index: candidate.index, ...detected };
  }

  const dataRows = rows.slice(bestHeader ? bestHeader.index + 1 : 0).filter((row) => row.some(Boolean));
  const mapping = inferColumns(dataRows, bestHeader?.mapping || new Map<number, ImportField>());
  return dataRows.flatMap((row) => {
    const repeatedHeader = headerMapping(row);
    if (repeatedHeader.mapping.size >= 2) return [];
    const record: LeadImportRow = {};
    mapping.forEach((field, index) => { if (row[index]) record[field] = row[index]; });
    return Object.keys(record).length ? [record] : [];
  });
}

export function parseCsvRows(csv: string): LeadImportRow[] {
  const rows = parse(csv, { skip_empty_lines: false, trim: true, bom: true, relax_column_count: true, relax_quotes: true }) as unknown[][];
  return parseTabularRows(rows);
}

function value(row: LeadImportRow, ...keys: string[]) {
  for (const key of keys) {
    const item = row[key];
    if (item !== null && item !== undefined && String(item).trim()) return String(item).trim();
  }
  return "";
}

function cleanLabeledValue(input: string) {
  return input.replace(/^\s*[^:]{1,30}:\s*/, "").trim();
}

function normalizedPhone(input: string) {
  return embeddedPhone(input).slice(0, 60);
}

function numericAmount(input: string) {
  const cleaned = input.toLowerCase().replace(/[٬,\s]/g, "").replace(/(?:egp|جنيه|le)/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const multiplier = /m(?:illion)?$/.test(cleaned) ? 1_000_000 : /k$/.test(cleaned) ? 1_000 : 1;
  return Math.max(0, Number(match[0]) * multiplier);
}

function normalizedStage(input: string) {
  const stage = normalizeLabel(input).replace(/\s+/g, "_");
  const mapped: Record<string, string> = { open: "new", fresh: "new", called: "contacted", follow_up: "contacted", interested: "qualified", quote: "proposal", quoted: "proposal", pending: "negotiation", rejected: "lost", closed_lost: "lost" };
  return stages.has(stage) ? stage : mapped[stage] || "new";
}

function normalizedPriority(input: string) {
  const priority = normalizeLabel(input);
  const mapped: Record<string, string> = { medium: "normal", med: "normal", hot: "urgent", critical: "urgent", important: "high" };
  const result = mapped[priority] || priority;
  return priorities.has(result) ? result : "normal";
}

function fallbackContactName(row: LeadImportRow, email: string, company: string) {
  const explicit = cleanLabeledValue(value(row, "contact_name", "contact", "name", "full_name")).slice(0, 120);
  if (explicit) return explicit;
  if (email) return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 120);
  return company.slice(0, 120);
}

function externalKey(row: LeadImportRow, email: string, phone: string, contact: string, company: string) {
  const explicit = value(row, "lead_id", "external_id", "id").slice(0, 160);
  if (explicit) return `id:${explicit}`;
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  return `row:${createHash("sha256").update(`${contact.toLowerCase()}|${company.toLowerCase()}`).digest("hex").slice(0, 32)}`;
}

export function googleSheetCsvUrl(sheetUrl: string, fallbackGid = "0") {
  const url = new URL(sheetUrl);
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") throw new Error("Use a valid Google Sheets URL.");
  const match = url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Google Sheet ID was not found in the URL.");
  const hashGid = new URLSearchParams(url.hash.replace(/^#/, "")).get("gid");
  const gid = url.searchParams.get("gid") || hashGid || fallbackGid || "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export async function fetchGoogleSheetRows(sheetUrl: string, gid = "0") {
  const response = await fetch(googleSheetCsvUrl(sheetUrl, gid), { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Google Sheet could not be read. Share it as 'Anyone with the link can view'.");
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 5_000_000) throw new Error("Google Sheet export is larger than 5 MB.");
  const csv = await response.text();
  if (csv.length > 5_000_000) throw new Error("Google Sheet export is larger than 5 MB.");
  return parseCsvRows(csv);
}

export async function importLeadRows(supabase: SupabaseClient, rows: LeadImportRow[], ownerId: string, sourceName: string) {
  if (!rows.length) return { imported: 0, skipped: 0 };
  if (rows.length > 5000) throw new Error("Imports are limited to 5,000 rows at a time.");

  type ExistingLead = { email: string | null; phone: string | null; external_source?: string | null; external_key?: string | null; category?: string | null };
  let supportsExternalKeys = true;
  let supportsCategory = true;
  let response = await supabase.from("crm_leads").select("email,phone,external_source,external_key,category");
  if (response.error?.message.includes("category")) {
    supportsCategory = false;
    response = await supabase.from("crm_leads").select("email,phone,external_source,external_key");
  }
  if (response.error?.message.includes("external_source") || response.error?.message.includes("external_key")) {
    supportsExternalKeys = false;
    response = await supabase.from("crm_leads").select(supportsCategory ? "email,phone,category" : "email,phone");
  }
  if (response.error) throw new Error(response.error.message);
  const existing = response.data as ExistingLead[] | null;
  const emails = new Set((existing || []).flatMap((lead) => lead.email ? [String(lead.email).toLowerCase()] : []));
  const phones = new Set((existing || []).flatMap((lead) => lead.phone ? [normalizedPhone(String(lead.phone))] : []));
  const keys = new Set((existing || []).flatMap((lead) => lead.external_source && lead.external_key ? [`${lead.external_source}:${lead.external_key}`] : []));

  const records = rows.flatMap((row) => {
    const companyName = cleanLabeledValue(value(row, "company_name", "company", "business", "organization")).slice(0, 160);
    const email = embeddedEmail(value(row, "email", "email_address")).slice(0, 200);
    const phone = normalizedPhone(value(row, "phone", "phone_number", "mobile", "whatsapp"));
    const contactName = fallbackContactName(row, email, companyName);
    const key = externalKey(row, email, phone, contactName, companyName);
    const dedupeKey = `${sourceName}:${key}`;
    if (!contactName || keys.has(dedupeKey) || (email && emails.has(email)) || (phone && phones.has(phone))) return [];
    keys.add(dedupeKey); if (email) emails.add(email); if (phone) phones.add(phone);
    const website = embeddedWebsite(value(row, "website", "url"));
    const amount = numericAmount(value(row, "expected_value", "estimated_value", "value", "amount"));
    const category = cleanLabeledValue(value(row, "category", "industry", "service", "type")).slice(0, 100);
    return [{
      contact_name: contactName,
      company_name: companyName || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      source: cleanLabeledValue(value(row, "source", "lead_source")).slice(0, 80) || sourceName,
      status: normalizedStage(value(row, "status", "stage")),
      priority: normalizedPriority(value(row, "priority")),
      estimated_value: Number.isFinite(amount) ? amount : 0,
      currency: "EGP",
      owner_id: ownerId,
      summary: cleanLabeledValue(value(row, "summary", "notes", "note", "details")).slice(0, 2000) || null,
      created_by: ownerId,
      ...(supportsCategory ? { category: category || null } : {}),
      ...(supportsExternalKeys ? { external_source: sourceName, external_key: key, imported_at: new Date().toISOString() } : {}),
    }];
  });

  if (records.length) {
    for (let index = 0; index < records.length; index += 500) {
      const { error } = await supabase.from("crm_leads").insert(records.slice(index, index + 500));
      if (error) throw new Error(error.message);
    }
  }
  return { imported: records.length, skipped: rows.length - records.length };
}
