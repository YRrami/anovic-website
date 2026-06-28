"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageProvider";
import { LANGS, type Lang } from "../i18n/translations";

type MenuPos = { top?: number; bottom?: number; left: number; width: number };

const MENU_WIDTH = 184;

export default function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const { lang, dir, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  // Position the fixed menu relative to the button (so it escapes the header
  // pill / drawer overflow:hidden). Runs in a layout effect AFTER `open`
  // flips true — guaranteeing `pos` is set before the menu paints.
  useLayoutEffect(() => {
    if (!open) return;

    const clamp = (left: number, width: number, vw: number) =>
      Math.max(8, Math.min(left, vw - width - 8));

    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const vw = window.innerWidth;

      if (variant === "drawer") {
        const width = Math.min(Math.max(r.width, MENU_WIDTH), vw - 16);
        setPos({ bottom: window.innerHeight - r.top + 10, left: clamp(r.left, width, vw), width });
      } else {
        const width = MENU_WIDTH;
        const rawLeft = dir === "rtl" ? r.left : r.right - width;
        setPos({ top: r.bottom + 10, left: clamp(rawLeft, width, vw), width });
      }
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, variant, dir]);

  // Close on outside pointer / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      if (target.closest?.(".lang-switch-menu")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className={`lang-switch lang-switch-${variant}`} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="lang-switch-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
      >
        <svg viewBox="0 0 24 24" className="lang-switch-globe" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        <span className="lang-switch-current">{current.native}</span>
        <span className={`lang-switch-caret ${open ? "is-open" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open &&
        pos &&
        createPortal(
          <ul
            className="lang-switch-menu"
            role="listbox"
            aria-label="Languages"
            dir={dir}
            style={{
              position: "fixed",
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
            }}
          >
            {LANGS.map((l) => (
              <li key={l.code} role="option" aria-selected={l.code === lang}>
                <button
                  type="button"
                  className={`lang-switch-item ${l.code === lang ? "is-active" : ""}`}
                  onClick={() => choose(l.code)}
                  dir={l.dir}
                >
                  <span className="lang-switch-badge">{l.native}</span>
                  <span className="lang-switch-name">{l.label}</span>
                  {l.code === lang && <span className="lang-switch-check" aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
