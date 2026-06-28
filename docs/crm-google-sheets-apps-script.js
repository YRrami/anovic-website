/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Google Apps Script bridge for Private Team CRM.
 * 1. Open a Google Sheet, then Extensions > Apps Script.
 * 2. Paste this file and set SYNC_TOKEN to the same secret saved in CRM settings.
 * 3. Deploy as a Web App, executing as yourself. Limit access to your account or domain.
 * 4. Save the deployment URL and Sheet URL in /crm/settings.
 */
const SYNC_TOKEN = "replace-with-a-long-random-secret";
const SHEET_NAME = "CRM Leads";

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  if (!payload.token || payload.token !== SYNC_TOKEN) {
    return ContentService.createTextOutput("Unauthorized").setMimeType(ContentService.MimeType.TEXT);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const headers = ["Contact", "Company", "Email", "Phone", "Source", "Stage", "Priority", "Value", "Currency", "Next follow-up", "Created"];
  const rows = (payload.leads || []).map((lead) => [
    lead.contact_name || "", lead.company_name || "", lead.email || "", lead.phone || "",
    lead.source || "", lead.status || "", lead.priority || "", Number(lead.estimated_value || 0),
    lead.currency || "EGP", lead.next_follow_up_at || "", lead.created_at || "",
  ]);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: rows.length })).setMimeType(ContentService.MimeType.JSON);
}
