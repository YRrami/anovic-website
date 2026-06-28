"use client";
import "../chat.css";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";

type Message = { role: "user" | "assistant"; content: string };
type Mood = "idle" | "thinking" | "happy" | "wave";

// ── Local FAQ engine ──────────────────────────────────────
// Pure keyword matching against the active-language dictionary.
// No API calls — everything runs in the browser, offline-safe.
function findAnswer(
  input: string,
  faqs: { keywords: string[]; answer: string }[],
  fallback: string,
): string {
  const clean = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = clean.split(/\s+/).filter(Boolean);

  let bestScore = 0;
  let bestAnswer = fallback;

  for (const faq of faqs) {
    let score = 0;
    for (const word of words) {
      for (const keyword of faq.keywords) {
        const k = keyword.toLowerCase();
        if (word === k) score += 2;
        else if (word.length > 3 && (word.includes(k) || k.includes(word))) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = faq.answer;
    }
  }
  return bestAnswer;
}

// ── Mascot: "Noura" — a folded-paper pin character ────────
function NouraMascot({ mood = "idle", size = 40 }: { mood?: Mood; size?: number }) {
  return (
    <span className={`noura-mascot noura-${mood}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        {/* push-pin */}
        <g className="noura-pin">
          <rect x="30" y="2" width="4" height="9" rx="2" fill="#78716c" />
          <circle cx="32" cy="6" r="5" fill="#ef4444" />
          <circle cx="30.4" cy="4.4" r="1.6" fill="#fff" opacity="0.7" />
        </g>

        {/* paper body with folded corner */}
        <path
          className="noura-body"
          d="M14 12 H44 a6 6 0 0 1 6 6 V46 a6 6 0 0 1 -6 6 H14 a6 6 0 0 1 -6 -6 V18 a6 6 0 0 1 6 -6 Z"
          fill="#fff8e8"
          stroke="#1c1917"
          strokeWidth="2.4"
        />
        <path className="noura-fold" d="M40 12 L50 22 L40 22 Z" fill="#ecdcc0" stroke="#1c1917" strokeWidth="2.4" strokeLinejoin="round" />

        {/* cheeks */}
        <circle className="noura-cheek" cx="20" cy="36" r="3.2" fill="#fbcfe8" />
        <circle className="noura-cheek" cx="40" cy="36" r="3.2" fill="#fbcfe8" />

        {/* eyes */}
        <g className="noura-eyes" fill="#1c1917">
          <circle className="noura-eye" cx="24" cy="30" r="2.6" />
          <circle className="noura-eye" cx="36" cy="30" r="2.6" />
        </g>

        {/* mouth — swaps per mood via CSS opacity */}
        <path className="noura-mouth noura-mouth-smile" d="M25 38 Q30 43 35 38" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" />
        <path className="noura-mouth noura-mouth-grin" d="M24 37 Q30 45 36 37 Z" fill="#7e22ce" stroke="#1c1917" strokeWidth="2.2" strokeLinejoin="round" />
        <circle className="noura-mouth noura-mouth-think" cx="30" cy="40" r="2" fill="#1c1917" />

        {/* waving hand */}
        <g className="noura-hand">
          <circle cx="52" cy="34" r="4.5" fill="#fff8e8" stroke="#1c1917" strokeWidth="2.2" />
        </g>
      </svg>
    </span>
  );
}

export default function AnovicChat() {
  const { t, dir } = useLanguage();
  const c = t.chat;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      // Quick hello wave when the panel opens.
      const waveId = window.setTimeout(() => setMood("wave"), 0);
      const id = window.setTimeout(() => setMood("idle"), 1400);
      return () => {
        window.clearTimeout(waveId);
        window.clearTimeout(id);
      };
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setThinking(true);
    setMood("thinking");

    // Small delay so it feels conversational rather than robotic
    await new Promise((r) => setTimeout(r, 420));

    const answer = findAnswer(trimmed, c.faqs, c.fallback);
    setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    setThinking(false);
    setMood("happy");
    window.setTimeout(() => setMood("idle"), 1600);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  function clearChat() {
    setMessages([]);
    setMood("wave");
    window.setTimeout(() => setMood("idle"), 1200);
  }

  function talkToTeam() {
    setOpen(false);
    document.getElementById("contact-us")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {open && (
        <div
          className="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label={`${c.name} — ${c.role}`}
          dir={dir}
        >
          <div className="chat-panel-tape" aria-hidden="true" />

          <div className="chat-toolbar">
            <div className="chat-toolbar-info">
              <span className="chat-avatar">
                <NouraMascot mood={mood} size={38} />
                <span className="chat-status-dot" aria-hidden="true" />
              </span>
              <div>
                <strong>{c.name}</strong>
                <small>{c.role}</small>
              </div>
            </div>
            <div className="chat-toolbar-actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="chat-icon-btn"
                  aria-label="Clear conversation"
                  title="Clear"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="chat-close-btn"
                aria-label={c.closeAria}
              >
                <span />
                <span />
              </button>
            </div>
          </div>

          <div className="chat-messages" aria-live="polite" aria-atomic="false">
            {messages.length === 0 && !thinking && (
              <div className="chat-welcome">
                <span className="tape" aria-hidden="true" />
                <div className="chat-welcome-mascot">
                  <NouraMascot mood="wave" size={62} />
                </div>
                <p className="chat-welcome-label">{c.welcomeLabel}</p>
                <strong>{c.welcomeStrong}</strong>
                <p>{c.welcomeText}</p>
                <div className="chat-quick-replies" role="list">
                  {c.quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="chat-quick-chip"
                      onClick={() => send(q)}
                      role="listitem"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="chat-bubble-avatar" aria-hidden="true">
                    <NouraMascot mood="idle" size={26} />
                  </span>
                )}
                <span className="chat-bubble-text">{msg.content}</span>
              </div>
            ))}

            {thinking && (
              <div className="chat-bubble chat-bubble-assistant">
                <span className="chat-bubble-avatar" aria-hidden="true">
                  <NouraMascot mood="thinking" size={26} />
                </span>
                <span className="chat-typing" aria-label={c.typingAria}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}

            {messages.length > 0 && !thinking && (
              <button type="button" className="chat-handoff" onClick={talkToTeam}>
                <span aria-hidden="true">✦</span>
                {t.header.startProject}
                <strong aria-hidden="true">{dir === "rtl" ? "←" : "→"}</strong>
              </button>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-row" aria-label={c.sendAria}>
            <label className="sr-only" htmlFor="chat-input-field">
              {c.inputPlaceholder}
            </label>
            <input
              id="chat-input-field"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.inputPlaceholder}
              className="chat-input"
              disabled={thinking}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={thinking || !input.trim()}
              aria-label={c.sendAria}
            >
              {dir === "rtl" ? "↑" : "↑"}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`chat-trigger ${open ? "is-open" : ""}`}
        aria-label={open ? c.closeAria : c.triggerAria}
        aria-expanded={open}
        dir={dir}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="chat-trigger-icon" aria-hidden="true">
            <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M18 6 6 18M6 6l12 12" fill="none" />
          </svg>
        ) : (
          <>
            <span className="chat-trigger-mascot">
              <NouraMascot mood="idle" size={30} />
            </span>
            <span className="chat-trigger-label">{c.triggerLabel}</span>
          </>
        )}
      </button>
    </>
  );
}
