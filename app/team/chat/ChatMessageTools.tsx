"use client";

import { useState } from "react";

export function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-gray-700 transition hover:bg-gray-50"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function MentionButton({
  label,
  mention,
  targetId,
}: {
  label: string;
  mention: string;
  targetId: string;
}) {
  function insertMention() {
    const textarea = document.getElementById(targetId) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const cleanMention = `@${mention.replace(/\s+/g, "")}`;
    const prefix = textarea.value && !textarea.value.endsWith(" ") ? " " : "";
    const insert = `${prefix}${cleanMention} `;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;

    textarea.value = `${textarea.value.slice(0, start)}${insert}${textarea.value.slice(end)}`;
    textarea.focus();
    textarea.selectionStart = start + insert.length;
    textarea.selectionEnd = start + insert.length;
  }

  return (
    <button
      type="button"
      onClick={insertMention}
      className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
    >
      @{label}
    </button>
  );
}
