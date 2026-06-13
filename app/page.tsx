/* eslint-disable @next/next/no-img-element */
"use client";
import "./test.css";
import "./our-work.css";
import "./i18n.css";
import AnovicChat from "./components/AnovicChat";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useLanguage } from "./i18n/LanguageProvider";
import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Static (language-neutral) visual config ───────────────
// Text for each of these comes from the i18n dictionary; only
// the non-translatable visual props live here, zipped by index.

const navHrefs = ["#home", "#services", "#our-work", "#about", "#why-us", "#contact-us"];

const serviceVisuals = [
  { number: "01", icon: "✦", tone: "purple", noteClass: "service-feature-one" },
  { number: "02", icon: "↗", tone: "lime", noteClass: "service-feature-two" },
  { number: "03", icon: "●", tone: "orange", noteClass: "service-feature-three" },
  { number: "04", icon: "⌘", tone: "stone", noteClass: "service-feature-four" },
];

const supportingVisuals = [
  { number: "05", color: "bg-[#fff4e8]" },
  { number: "06", color: "bg-[#f3e8ff]" },
  { number: "07", color: "bg-[#ecfccb]" },
];

const boardNoteVisuals = [
  { className: "note-one", tone: "text-purple-700" },
  { className: "note-two", tone: "text-lime-700" },
  { className: "note-three", tone: "text-orange-700" },
  { className: "note-four", tone: "text-stone-500" },
];

const scopeRowVisuals = [
  { number: "01", accent: "purple" },
  { number: "02", accent: "lime" },
  { number: "03", accent: "orange" },
  { number: "04", accent: "stone" },
  { number: "05", accent: "purple" },
  { number: "06", accent: "lime" },
  { number: "07", accent: "orange" },
];

const whyCardVisuals = [
  { icon: "🧾", tone: "purple" },
  { icon: "🤝", tone: "lime" },
  { icon: "🏠", tone: "orange" },
  { icon: "🎯", tone: "stone" },
  { icon: "🧠", tone: "cream" },
];

type WorkMockupPattern =
  | "brand"
  | "social"
  | "website"
  | "outdoor"
  | "media"
  | "strategy";

type WorkMockupOptions = {
  title: string;
  label: string;
  tone: "purple" | "lime" | "orange" | "stone" | "dark" | "cream";
  pattern: WorkMockupPattern;
};

// Put your PNG files inside: /public/portfolio/
const portfolioImages = {
  featured: "/portfolio/featured-work.png",
  branding: "/portfolio/branding.png",
  marketing: "/portfolio/campaigns.png",
  software: "/portfolio/software.png",
  outdoor: "/portfolio/outdoor.png",
  media: "/portfolio/media-production.png",
  business: "/portfolio/business-strategy-pack.png",
};

const mockupPalettes = {
  purple: { bg: "#f3e8ff", ink: "#2e1065", accent: "#a855f7", soft: "#ffffff" },
  lime: { bg: "#ecfccb", ink: "#1a2e05", accent: "#84cc16", soft: "#ffffff" },
  orange: { bg: "#ffedd5", ink: "#431407", accent: "#fb923c", soft: "#ffffff" },
  stone: { bg: "#fffaf0", ink: "#292524", accent: "#78716c", soft: "#ffffff" },
  dark: { bg: "#171717", ink: "#ffffff", accent: "#d9f99d", soft: "#292524" },
  cream: { bg: "#fff7ed", ink: "#292524", accent: "#a855f7", soft: "#ffffff" },
};

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

type MockupPalette = (typeof mockupPalettes)[keyof typeof mockupPalettes];

function renderMockupShapes(pattern: WorkMockupPattern, palette: MockupPalette) {
  const { ink, accent, soft } = palette;

  if (pattern === "brand") {
    return `
      <circle cx="94" cy="132" r="42" fill="${accent}" opacity="0.92"/>
      <text x="94" y="143" text-anchor="middle" font-size="32" font-weight="900" fill="${soft}">A</text>
      <rect x="168" y="86" width="220" height="28" rx="14" fill="${ink}" opacity="0.9"/>
      <rect x="168" y="128" width="160" height="18" rx="9" fill="${ink}" opacity="0.28"/>
      <rect x="168" y="162" width="54" height="54" rx="18" fill="${accent}" opacity="0.75"/>
      <rect x="234" y="162" width="54" height="54" rx="18" fill="${ink}" opacity="0.78"/>
      <rect x="300" y="162" width="54" height="54" rx="18" fill="${soft}" opacity="0.9"/>
    `;
  }

  if (pattern === "social") {
    return `
      <rect x="58" y="52" width="148" height="236" rx="34" fill="${ink}" opacity="0.9"/>
      <rect x="74" y="78" width="116" height="72" rx="18" fill="${accent}" opacity="0.9"/>
      <rect x="74" y="166" width="116" height="14" rx="7" fill="${soft}" opacity="0.92"/>
      <rect x="74" y="192" width="84" height="12" rx="6" fill="${soft}" opacity="0.52"/>
      <rect x="234" y="74" width="154" height="86" rx="24" fill="${soft}" opacity="0.82"/>
      <rect x="234" y="182" width="112" height="86" rx="24" fill="${accent}" opacity="0.82"/>
      <circle cx="362" cy="224" r="22" fill="${ink}" opacity="0.84"/>
    `;
  }

  if (pattern === "website") {
    return `
      <rect x="48" y="58" width="352" height="220" rx="26" fill="${soft}" opacity="0.92"/>
      <rect x="48" y="58" width="352" height="44" rx="26" fill="${ink}" opacity="0.9"/>
      <circle cx="78" cy="80" r="6" fill="${accent}"/>
      <circle cx="98" cy="80" r="6" fill="${soft}" opacity="0.7"/>
      <circle cx="118" cy="80" r="6" fill="${soft}" opacity="0.46"/>
      <rect x="76" y="132" width="138" height="22" rx="11" fill="${ink}" opacity="0.82"/>
      <rect x="76" y="168" width="188" height="13" rx="7" fill="${ink}" opacity="0.28"/>
      <rect x="76" y="194" width="96" height="34" rx="17" fill="${accent}" opacity="0.92"/>
      <rect x="286" y="124" width="78" height="118" rx="24" fill="${accent}" opacity="0.78"/>
    `;
  }

  if (pattern === "outdoor") {
    return `
      <rect x="58" y="72" width="332" height="154" rx="20" fill="${ink}" opacity="0.9"/>
      <rect x="86" y="104" width="150" height="24" rx="12" fill="${soft}" opacity="0.92"/>
      <rect x="86" y="146" width="102" height="14" rx="7" fill="${soft}" opacity="0.5"/>
      <rect x="272" y="102" width="74" height="74" rx="22" fill="${accent}" opacity="0.95"/>
      <rect x="108" y="226" width="18" height="74" rx="9" fill="${ink}" opacity="0.74"/>
      <rect x="322" y="226" width="18" height="74" rx="9" fill="${ink}" opacity="0.74"/>
      <path d="M36 300 H412" stroke="${ink}" stroke-width="10" opacity="0.16" stroke-linecap="round"/>
    `;
  }

  if (pattern === "media") {
    return `
      <rect x="54" y="64" width="340" height="200" rx="28" fill="${ink}" opacity="0.9"/>
      <circle cx="224" cy="164" r="48" fill="${accent}" opacity="0.96"/>
      <path d="M213 139 L213 189 L253 164 Z" fill="${soft}" opacity="0.96"/>
      <rect x="78" y="284" width="70" height="14" rx="7" fill="${ink}" opacity="0.28"/>
      <rect x="162" y="284" width="70" height="14" rx="7" fill="${accent}" opacity="0.7"/>
      <rect x="246" y="284" width="70" height="14" rx="7" fill="${ink}" opacity="0.28"/>
    `;
  }

  return `
    <rect x="64" y="56" width="140" height="230" rx="24" fill="${soft}" opacity="0.9"/>
    <rect x="88" y="90" width="86" height="18" rx="9" fill="${ink}" opacity="0.78"/>
    <rect x="88" y="126" width="72" height="10" rx="5" fill="${ink}" opacity="0.24"/>
    <rect x="88" y="154" width="28" height="72" rx="12" fill="${accent}" opacity="0.88"/>
    <rect x="126" y="178" width="28" height="48" rx="12" fill="${ink}" opacity="0.64"/>
    <rect x="164" y="136" width="28" height="90" rx="12" fill="${accent}" opacity="0.48"/>
    <rect x="236" y="82" width="148" height="58" rx="18" fill="${ink}" opacity="0.84"/>
    <rect x="236" y="160" width="148" height="26" rx="13" fill="${accent}" opacity="0.82"/>
    <rect x="236" y="206" width="104" height="14" rx="7" fill="${ink}" opacity="0.28"/>
  `;
}

function createWorkMockup({ title, label, tone, pattern }: WorkMockupOptions) {
  const palette = mockupPalettes[tone];
  const safeTitle = escapeSvgText(title);
  const safeLabel = escapeSvgText(label);
  const shapes = renderMockupShapes(pattern, palette);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 336" role="img" aria-label="${safeTitle} mockup placeholder">
      <defs>
        <linearGradient id="paperGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${palette.bg}"/>
          <stop offset="0.56" stop-color="${palette.soft}" stop-opacity="0.95"/>
          <stop offset="1" stop-color="${palette.bg}"/>
        </linearGradient>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="${palette.ink}" opacity="0.12"/>
        </pattern>
      </defs>
      <rect width="448" height="336" rx="36" fill="url(#paperGlow)"/>
      <rect width="448" height="336" rx="36" fill="url(#dots)"/>
      <circle cx="398" cy="44" r="74" fill="${palette.accent}" opacity="0.2"/>
      <circle cx="36" cy="304" r="90" fill="${palette.accent}" opacity="0.14"/>
      ${shapes}
      <rect x="26" y="24" width="148" height="32" rx="16" fill="${palette.ink}" opacity="0.86"/>
      <text x="100" y="45" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="${palette.soft}">${safeLabel}</text>
      <text x="28" y="318" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="${palette.ink}">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const featuredWorkVisual = {
  image: portfolioImages.featured,
  mockup: { tone: "dark" as const, pattern: "website" as const },
};

const workProjectVisuals = [
  { tone: "purple", image: portfolioImages.branding, mockup: { tone: "purple" as const, pattern: "brand" as const } },
  { tone: "lime", image: portfolioImages.marketing, mockup: { tone: "lime" as const, pattern: "social" as const } },
  { tone: "orange", image: portfolioImages.software, mockup: { tone: "orange" as const, pattern: "website" as const } },
  { tone: "stone", image: portfolioImages.outdoor, mockup: { tone: "stone" as const, pattern: "outdoor" as const } },
  { tone: "dark", image: portfolioImages.media, mockup: { tone: "dark" as const, pattern: "media" as const } },
  { tone: "cream", image: portfolioImages.business, mockup: { tone: "cream" as const, pattern: "strategy" as const } },
];

// Replace these # links with your real social media profile URLs.
const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/anovicagency/",
    paths: [
      "M14.5 8.5V6.9c0-.72.32-1.12 1.2-1.12h1.55V3.13C16.98 3.09 16.08 3 15.1 3c-2.25 0-3.78 1.37-3.78 3.9v1.6H8.78v3h2.54V21h3.18v-9.5h2.52l.4-3h-2.92Z",
    ],
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/anovic_agency/",
    paths: [
      "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Z",
      "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M17.25 6.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
    ],
  },
  {
    label: "LinkedIn",
    href: "#",
    paths: [
      "M6.55 8.75H3.4V21h3.15V8.75ZM5 3a1.84 1.84 0 1 0 0 3.68A1.84 1.84 0 0 0 5 3Zm16 11.16c0-3.28-1.75-5.39-4.6-5.39-1.67 0-2.78.92-3.24 1.8h-.05V8.75h-3.02V21h3.15v-6.06c0-1.6.3-3.14 2.28-3.14 1.95 0 1.98 1.82 1.98 3.24V21H21v-6.84Z",
    ],
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@anovic_agency?is_from_webapp=1&sender_device=pc",
    paths: [
      "M15.72 3c.28 2.28 1.56 3.64 3.78 3.78v3.1a7.2 7.2 0 0 1-3.7-1.15v5.72c0 4.08-2.63 6.55-6.18 6.55C6.43 21 4 18.8 4 15.82c0-3.26 2.56-5.58 5.95-5.45.34 0 .67.04.98.1v3.23a3.43 3.43 0 0 0-.98-.15c-1.5 0-2.6.86-2.6 2.2 0 1.24.98 2.12 2.28 2.12 1.54 0 2.53-.92 2.53-2.88V3h3.56Z",
    ],
  },
];

const BUSINESS_EMAIL = "business@anovic.net";
const EMAIL_SUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${BUSINESS_EMAIL}`;

// Add your PDF here later:
// public/portfolio/anovic-portfolio.pdf
const PORTFOLIO_PDF_FILE = "/portfolio/Anovic Portfolio 2021-2026.pdf";

type SubmissionStatus = "idle" | "sending" | "success" | "error";

async function sendToBusinessEmail(payload: Record<string, string>) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value);
  });

  formData.append("_template", "table");
  formData.append("_captcha", "false");

  const response = await fetch(EMAIL_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to submit the form right now.");
  }
}

function AnovicInitialLoader({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="anovic-loader-screen" aria-label="Loading Anovic">
      <img
        src="/mark.png"
        alt="Anovic loading mark"
        className="anovic-loader-mark"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

export default function Home() {
  const { t, dir } = useLanguage();

  const [open, setOpen] = useState(false);
  const [leadValue, setLeadValue] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [leadStatus, setLeadStatus] = useState<SubmissionStatus>("idle");
  const [contactStatus, setContactStatus] = useState<SubmissionStatus>("idle");
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const navLinks = t.nav;
  const navItems = [
    { label: navLinks.home, href: navHrefs[0] },
    { label: navLinks.services, href: navHrefs[1] },
    { label: navLinks.work, href: navHrefs[2] },
    { label: navLinks.about, href: navHrefs[3] },
    { label: navLinks.why, href: navHrefs[4] },
    { label: navLinks.contact, href: navHrefs[5] },
  ];

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanLead = leadValue.trim();

    if (!cleanLead) {
      setLeadStatus("error");
      return;
    }

    try {
      setLeadStatus("sending");

      await sendToBusinessEmail({
        _subject: "New hero lead from Anovic website",
        Form: "Hero quick lead form",
        "Email or Phone": cleanLead,
        "Submitted From": window.location.href,
        "Submitted At": new Date().toLocaleString(),
      });

      setLeadValue("");
      setLeadStatus("success");
    } catch (error) {
      console.error(error);
      setLeadStatus("error");
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const services = formData.getAll("services").join(", ");

    try {
      setContactStatus("sending");

      await sendToBusinessEmail({
        _subject: "New website contact request",
        _honey: String(formData.get("_honey") || ""),
        Form: "Contact us project brief form",
        "Full Name": String(formData.get("fullName") || ""),
        "Phone Number": String(formData.get("phone") || ""),
        "Email Address": String(formData.get("email") || ""),
        "Company / Brand Name": String(formData.get("company") || ""),
        "Services Needed": services || "Not selected",
        "Budget Range": String(formData.get("budget") || "Not selected"),
        Message: String(formData.get("message") || ""),
        "Submitted From": window.location.href,
        "Submitted At": new Date().toLocaleString(),
      });

      form.reset();
      setContactStatus("success");
    } catch (error) {
      console.error(error);
      setContactStatus("error");
    }
  };

  useEffect(() => {
    const startedAt = Date.now();
    const minimumLoaderTime = 900;

    const hideLoader = () => {
      const elapsed = Date.now() - startedAt;
      const remainingTime = Math.max(0, minimumLoaderTime - elapsed);

      window.setTimeout(() => {
        setIsInitialLoading(false);
      }, remainingTime);
    };

    const safetyTimer = window.setTimeout(() => {
      setIsInitialLoading(false);
    }, 4000);

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }

    return () => {
      window.clearTimeout(safetyTimer);
      window.removeEventListener("load", hideLoader);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setOpen(false);
    };

    closeOnDesktop();
    window.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 640);
      const docEl = document.documentElement;
      const max = docEl.scrollHeight - docEl.clientHeight;
      const ratio = max > 0 ? docEl.scrollTop / max : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${Math.min(
          1,
          Math.max(0, ratio),
        )})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const allProjects = t.work.projects.map((project, i) => ({
    ...project,
    ...workProjectVisuals[i],
    fallbackImage: createWorkMockup({
      title: project.title,
      label: project.label,
      tone: workProjectVisuals[i].mockup.tone,
      pattern: workProjectVisuals[i].mockup.pattern,
    }),
  }));

  const visibleProjects =
    activeFilterIndex === 0
      ? allProjects
      : allProjects.filter(
          (project) => project.category === t.work.filters[activeFilterIndex],
        );

  const featuredFallback = createWorkMockup({
    title: t.work.featuredHeadline.slice(0, 18),
    label: t.work.featuredTicket,
    tone: featuredWorkVisual.mockup.tone,
    pattern: featuredWorkVisual.mockup.pattern,
  });

  const activeSocials = socialLinks.filter((social) => social.href !== "#");

  return (
    <main className="paper-app min-h-screen overflow-hidden text-stone-950" dir={dir}>
      <AnovicInitialLoader show={isInitialLoading} />
      <div className="paper-world-bg" aria-hidden="true" />

      {/* Header */}
      <header className="fixed left-0 top-0 z-50 w-full px-3 pt-3 sm:px-4 sm:pt-5">
        <div className="glass-orbit-header mx-auto max-w-7xl">
          <a href="#home" className="brand-orbit group" aria-label={t.a11y.home}>
            <span className="logo-plain-mark">
              <img
                src="/logo.png"
                alt="Anovic logo"
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
            </span>
          </a>

          <div className="header-right-cluster">
            <nav className="nav-glass-pill hidden lg:flex" aria-label="Primary navigation">
              {navItems.map((link) => (
                <a key={link.href} href={link.href} className="nav-glass-link">
                  {link.label}
                </a>
              ))}
            </nav>

            <LanguageSwitcher variant="header" />

            <a href="#contact-us" className="header-glow-cta hidden lg:inline-flex">
              {t.header.bookCall}
            </a>

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className={`mobile-orbit-btn lg:hidden ${open ? "is-open" : ""}`}
              aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
              aria-controls="mobile-navigation"
              aria-expanded={open}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div
          className="mobile-drawer-shell fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="drawer-backdrop absolute inset-0"
            aria-label="Close menu backdrop"
          />

          <aside
            id="mobile-navigation"
            className="drawer-paper drawer-panel absolute top-0 flex h-full w-[91%] max-w-[430px] flex-col overflow-hidden p-4 shadow-2xl sm:p-5"
            style={dir === "rtl" ? { left: 0 } : { right: 0 }}
          >
            <div className="drawer-ambient" aria-hidden="true" />
            <div className="drawer-grain" aria-hidden="true" />

            <div className="drawer-header-row">
              <a
                href="#home"
                onClick={() => setOpen(false)}
                className="drawer-brand-lockup"
                aria-label={t.a11y.home}
              >
                <img
                  src="/anovic white logo.png"
                  alt="Anovic logo"
                  className="h-full w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </a>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="drawer-close-btn"
                aria-label={t.a11y.closeMenu}
              >
                <span />
                <span />
              </button>
            </div>

            <div className="drawer-menu-intro">
              <span>{t.header.menu}</span>
              <p>{t.header.menuHint}</p>
            </div>

            <nav className="drawer-nav-list" aria-label="Mobile navigation links">
              {navItems.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="drawer-nav-link"
                  style={{ "--drawer-index": index } as CSSProperties}
                >
                  <span className="drawer-link-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="drawer-link-label">{link.label}</span>
                  <span className="drawer-link-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </nav>

            <div className="drawer-footer-card">
              <div className="drawer-lang-row">
                <LanguageSwitcher variant="drawer" />
              </div>

              <a
                href="#contact-us"
                onClick={() => setOpen(false)}
                className="drawer-cta"
              >
                <span>{t.header.startProject}</span>
                <strong aria-hidden="true">↗</strong>
              </a>

              <div className="drawer-contact-row">
                <a href="tel:+201148000500">{t.header.call}</a>
                <a href="mailto:business@anovic.net">{t.header.email}</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Hero */}
      <section
        id="home"
        className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-5 sm:pt-32 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-20"
      >
        <div className="hero-copy relative">
          <div className="hero-badge mb-6 inline-flex -rotate-1 items-center gap-2 rounded-full border border-stone-950/10 bg-white/70 px-4 py-2 text-xs font-black text-stone-600 shadow-sm backdrop-blur sm:mb-7 sm:text-sm">
            <span className="hero-badge-dot h-2.5 w-2.5 rounded-full bg-lime-300 ring-4 ring-lime-200/70" />
            {t.hero.badge}
          </div>

          <h1 className="max-w-4xl text-[3.15rem] font-black leading-[0.92] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl xl:text-8xl">
            {t.hero.h1a}
            <br />
            {t.hero.h1b}
            <br />
            <span className="relative inline-block">
              {t.hero.h1c}
              <span className="hero-marker absolute bottom-1 left-0 -z-10 h-5 w-full rotate-[-1deg] bg-lime-300/80 sm:h-6 lg:h-7" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-stone-600 sm:mt-7 sm:text-lg">
            {t.hero.subtitle}
          </p>

          <form
            onSubmit={handleLeadSubmit}
            className="hero-lead-bar"
            aria-label="Lead capture form"
          >
            <div className="hero-lead-content">
              <span className="hero-lead-pill">{t.hero.leadPill}</span>

              <div className="hero-lead-text">
                <strong>{t.hero.leadStrong}</strong>
                <p>{t.hero.leadText}</p>
              </div>
            </div>

            <div className="hero-lead-field">
              <label className="sr-only" htmlFor="hero-lead-contact">
                {t.hero.leadPlaceholder}
              </label>

              <span className="hero-lead-icon" aria-hidden="true">
                ↗
              </span>

              <input
                id="hero-lead-contact"
                name="lead-contact"
                type="text"
                inputMode="text"
                value={leadValue}
                onChange={(event) => setLeadValue(event.target.value)}
                placeholder={t.hero.leadPlaceholder}
                className="hero-lead-input"
              />

              <button
                type="submit"
                className="hero-lead-submit"
                disabled={leadStatus === "sending"}
              >
                {leadStatus === "sending" ? t.hero.leadSending : t.hero.leadSend}
              </button>
            </div>

            {leadStatus !== "idle" && (
              <p
                className={`mt-3 text-sm font-black ${
                  leadStatus === "success"
                    ? "text-lime-700"
                    : leadStatus === "sending"
                      ? "text-stone-500"
                      : "text-red-700"
                }`}
                role="status"
              >
                {leadStatus === "success"
                  ? t.hero.leadSuccess
                  : leadStatus === "sending"
                    ? t.hero.leadSendingMsg
                    : t.hero.leadError}
              </p>
            )}
          </form>

          <div className="hero-social-row" aria-label="Social media links">
            <span>{t.hero.follow}</span>
            <div className="social-icon-list">
              {activeSocials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={`Open ${social.label}`}
                  className="social-icon-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {social.paths.map((path) => (
                      <path key={path} d={path} />
                    ))}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="hero-board relative">
          <div className="hanging-note hanging-note-left hidden lg:block">
            {t.board.hangLeft}
          </div>

          <div className="hanging-note hanging-note-right hidden lg:block">
            {t.board.hangRight}
          </div>

          <div className="studio-board mx-auto max-w-2xl">
            <div className="board-toolbar">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500 sm:text-xs">
                  {t.board.kicker}
                </p>
                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  {t.board.title}
                </h3>
              </div>

              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-lime-400" />
              </div>
            </div>

            <div className="board-canvas">
              <div className="board-glow" />

              <div className="string-line string-line-one" />
              <div className="string-line string-line-two" />

              <div className="pin pin-red left-[13%] top-[12%]" />
              <div className="pin pin-purple right-[13%] top-[13%]" />
              <div className="pin pin-lime bottom-[16%] left-[18%]" />
              <div className="pin pin-dark bottom-[18%] right-[15%]" />

              {t.board.notes.map((note, i) => (
                <div key={note.title} className={`note-card ${boardNoteVisuals[i].className}`}>
                  <span className="tape" />
                  <p
                    className={`text-xs font-black uppercase tracking-[0.18em] ${boardNoteVisuals[i].tone}`}
                  >
                    {note.step}
                  </p>
                  <h4 className="mt-3 text-lg font-black sm:text-xl">
                    {note.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {note.text}
                  </p>
                </div>
              ))}

              <div className="board-stamp">{t.board.stamp}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="services-heading-wrap">
            <div className="section-paper-intro">
              <span className="tape tape-left" />

              <div className="section-doodle-stars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <p className="section-kicker">
                <span className="kicker-dot" />
                {t.services.kicker}
              </p>

              <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                {t.services.headingPre}{" "}
                <span className="marker-highlight marker-purple">{t.services.headingServices}</span>{" "}
                {t.services.headingMid}{" "}
                <span className="scribble-word">{t.services.headingAngle}</span>.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                {t.services.para}{" "}
                <span className="marker-highlight marker-lime">{t.services.paraStrategy}</span>,{" "}
                <span className="marker-highlight marker-orange">{t.services.paraCreativity}</span>,{" "}
                {t.services.paraFramework}{" "}
                <span className="scribble-underline">
                  {t.services.frameworkPhrase}
                </span>
                .
              </p>

              <div className="intro-chip-row">
                {t.services.chips.map((chip) => (
                  <span key={chip} className="intro-chip">{chip}</span>
                ))}
              </div>

              <div className="quote-strip">
                <span className="quote-strip-tag">{t.services.pinnedTag}</span>
                <p>{t.services.pinnedText}</p>
              </div>
            </div>

            <div className="services-mini-board">
              <div className="mini-board-line" />
              <div className="mini-pin mini-pin-red" />
              <div className="mini-pin mini-pin-lime" />

              <div className="mini-note mini-note-one">
                <span className="tape" />
                <p className="mini-note-label">{t.services.miniFocusLabel}</p>
                <h4>
                  <span className="marker-highlight marker-purple">
                    {t.services.miniFocusMainGrowth}
                  </span>{" "}
                  {t.services.miniFocusServices}
                </h4>
                <p>{t.services.miniFocusText}</p>
              </div>

              <div className="mini-note mini-note-two">
                <span className="tape" />
                <p className="mini-note-label">{t.services.miniApproachLabel}</p>
                <h4>
                  <span className="scribble-word">{t.services.miniApproachOrganized}</span>{" "}
                  {t.services.miniApproachExec}
                </h4>
                <p>{t.services.miniApproachText}</p>
              </div>
            </div>
          </div>

          <div className="services-showcase">
            <div className="service-thread thread-one" />
            <div className="service-thread thread-two" />

            {t.services.cards.map((service, i) => (
              <article
                key={service.title}
                className={`service-feature-card ${serviceVisuals[i].noteClass} ${serviceVisuals[i].tone}`}
              >
                <span className="tape" />
                <span className="service-pin" />

                <div className="service-card-doodle" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="service-badge-row">
                  <p className="service-number">{serviceVisuals[i].number}</p>
                  <span className="service-chip">{service.subtitle}</span>
                </div>

                <div className="service-stamp-row">
                  <span className="mini-stamp">{service.stamp}</span>
                </div>

                <div className="service-icon-mark" aria-hidden="true">
                  {serviceVisuals[i].icon}
                </div>

                <h3 className="mt-4 text-2xl font-black leading-tight sm:text-[1.75rem]">
                  <span className="headline-scribble">{service.title}</span>
                </h3>

                <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-[15px]">
                  {service.text}
                </p>

                <div className="service-micro-note">
                  <span className="micro-note-dot" />
                  <p>{service.note}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {service.bullets.map((bullet) => (
                    <span key={bullet} className="service-bullet-chip">
                      {bullet}
                    </span>
                  ))}
                </div>

                <div className="service-footer-strip">
                  <span>{t.services.miniFocusLabel}</span>
                  <strong>{service.metric}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="supporting-services-wrap">
            <div className="mb-8">
              <p className="section-kicker text-stone-500">
                <span className="kicker-dot stone" />
                {t.services.supportingKicker}
              </p>

              <h3 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {t.services.supportingHeadingPre}{" "}
                <span className="marker-highlight marker-lime">{t.services.supportingComplete}</span>{" "}
                {t.services.supportingHeadingPost}
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {t.services.supporting.map((service, index) => (
                <article
                  key={service.title}
                  className={`supporting-service-card ${supportingVisuals[index].color} ${
                    index % 2 === 0 ? "service-note-left" : "service-note-right"
                  }`}
                >
                  <span className="tape" />
                  <span className="supporting-pin" />

                  <div className="supporting-topline">
                    <p className="text-sm font-black text-stone-500">
                      {supportingVisuals[index].number}
                    </p>
                    <span className="supporting-mini-label">
                      {service.label}
                    </span>
                  </div>

                  <h4 className="mt-4 text-2xl font-black">
                    <span className="headline-scribble">{service.title}</span>
                  </h4>

                  <p className="mt-4 text-sm leading-7 text-stone-600">
                    {service.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="services-scope-layout">
            <div className="scope-board-shell">
              <div className="studio-board scope-studio-board">
                <div className="board-toolbar">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500 sm:text-xs">
                      {t.services.boardKicker}
                    </p>
                    <h3 className="mt-1 text-xl font-black sm:text-2xl">
                      {t.services.boardTitle}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-lime-400" />
                  </div>
                </div>

                <div className="board-canvas scope-board-canvas">
                  <div className="board-glow" />

                  <div className="string-line scope-string-one" />
                  <div className="string-line scope-string-two" />
                  <div className="string-line scope-string-three" />

                  <div className="pin pin-red scope-pin-one" />
                  <div className="pin pin-purple scope-pin-two" />
                  <div className="pin pin-lime scope-pin-three" />
                  <div className="pin pin-dark scope-pin-four" />

                  {t.services.scopeRows.map((row, index) => (
                    <article
                      key={row.category}
                      className={`scope-map-note scope-map-note-${index + 1} scope-${scopeRowVisuals[index].accent}`}
                    >
                      <span className="tape" />

                      <div className="scope-map-topline">
                        <span className="scope-map-number">{scopeRowVisuals[index].number}</span>
                        <span className="scope-map-tag">{row.tag}</span>
                      </div>

                      <h4>{row.category}</h4>

                      <p>{row.scope}</p>

                      <div className="scope-map-chip-row">
                        {row.chips.map((chip) => (
                          <span key={chip}>{chip}</span>
                        ))}
                      </div>
                    </article>
                  ))}

                  <div className="board-stamp scope-board-stamp">
                    {t.services.boardStamp}
                  </div>
                </div>
              </div>
            </div>

            <aside className="positioning-column">
              <div className="positioning-note-card">
                <span className="tape" />
                <span className="position-pin" />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
                  {t.services.posTag}
                </p>

                <h4 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
                  {t.services.posHeadingPre}{" "}
                  <span className="marker-highlight marker-orange">
                    {t.services.posPartner}
                  </span>
                  .
                </h4>

                <p className="positioning-main-text">{t.services.posText}</p>

                <div className="mt-5 grid gap-3">
                  {t.services.posItems.map((item) => (
                    <div key={item} className="position-line-item">
                      <span className="position-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="position-footer-note">
                  <span className="micro-note-dot" />
                  <p>{t.services.posFooter}</p>
                </div>
              </div>

              <div className="scope-proof-card">
                <span className="proof-stamp">{t.services.proofStamp}</span>
                <h4>{t.services.proofHeading}</h4>
                <p>{t.services.proofText}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Our Work */}
      <section
        id="our-work"
        className="work-section relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="work-bg-grid" aria-hidden="true" />
        <div className="work-shell mx-auto max-w-7xl">
          <div className="work-header-card">
            <span className="tape tape-left" />

            <div className="work-header-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  {t.work.kicker}
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
                  {t.work.headingPre}{" "}
                  <span className="marker-highlight marker-lime">
                    {t.work.headingHarder}
                  </span>
                  .
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                  {t.work.para}
                </p>
              </div>

              <aside className="work-sticky-note">
                <span className="work-note-pin" />
                <small>{t.work.notePinned}</small>
                <strong>{t.work.noteStrong}</strong>
                <p>{t.work.noteText}</p>
              </aside>
            </div>

            <div className="work-filter-row" aria-label="Our work categories">
              {t.work.filters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilterIndex(index)}
                  aria-pressed={activeFilterIndex === index}
                  className={`work-filter-pill ${activeFilterIndex === index ? "is-active" : ""}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="work-action-row">
              <a
                href={PORTFOLIO_PDF_FILE}
                download="Anovic-Portfolio.pdf"
                className="work-download-btn"
              >
                <span aria-hidden="true">↓</span>
                {t.work.download}
              </a>
              <small>{t.work.downloadHint}</small>
            </div>
          </div>

          <div className="work-featured-layout">
            <article className="work-featured-card">
              <div className="work-featured-copy">
                <span className="work-featured-label">{t.work.featuredLabel}</span>
                <h3>{t.work.featuredHeadline}</h3>
                <p>{t.work.featuredStory}</p>

                <div className="work-chip-row">
                  {t.work.featuredServices.map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>

                <div className="work-result-box">
                  <span>{t.work.featuredResultLabel}</span>
                  <strong>{t.work.featuredResult}</strong>
                </div>
              </div>

              <div className="work-featured-visual">
                <img
                  src={featuredWorkVisual.image}
                  alt="Anovic featured work preview"
                  width={448}
                  height={336}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = featuredFallback;
                  }}
                />
                <div className="work-floating-ticket">
                  <span>{t.work.featuredTicket}</span>
                  <strong>{t.work.featuredCategory}</strong>
                </div>
              </div>
            </article>

            <aside className="work-process-card">
              <span className="tape" />
              <p className="work-process-kicker">{t.work.processKicker}</p>
              <h3>{t.work.processHeading}</h3>

              <div className="work-process-list">
                {t.work.process.map((step) => (
                  <div key={step.step}>
                    <span>{step.step}</span>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="work-grid">
            {visibleProjects.map((project, index) => (
              <article
                key={project.title}
                className={`work-project-card work-project-${project.tone}`}
                style={{ "--work-index": index } as CSSProperties}
              >
                <span className="tape" />

                <div className="work-project-image">
                  <img
                    src={project.image}
                    alt={`${project.title} portfolio preview`}
                    width={448}
                    height={336}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = project.fallbackImage;
                    }}
                  />
                  <span>{project.label}</span>
                </div>

                <div className="work-project-body">
                  <div className="work-project-topline">
                    <span>{project.category}</span>
                    <strong>{project.result}</strong>
                  </div>

                  <h3>{project.title}</h3>
                  <p>{project.description}</p>

                  <div className="work-chip-row compact">
                    {project.services.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>

                  <div className="work-before-after-mini">
                    <div>
                      <span>{t.work.beforeLabel}</span>
                      <strong>{project.before}</strong>
                    </div>
                    <div>
                      <span>{t.work.afterLabel}</span>
                      <strong>{project.after}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="work-before-after-strip">
            {t.work.strip.map((item) => (
              <div key={item.k}>
                <span>{item.k}</span>
                <strong>{item.v}</strong>
              </div>
            ))}
          </div>

          <div className="work-cta-card">
            <div>
              <span>{t.work.ctaSpan}</span>
              <h3>{t.work.ctaHeading}</h3>
            </div>
            <div className="work-cta-actions">
              <a href="#contact-us">{t.work.ctaStart}</a>
              <a
                href={PORTFOLIO_PDF_FILE}
                download="Anovic-Portfolio.pdf"
                className="work-cta-download"
              >
                {t.work.ctaDownload}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="about-shell mx-auto max-w-7xl">
          <div className="about-orbit about-orbit-one" aria-hidden="true" />
          <div className="about-orbit about-orbit-two" aria-hidden="true" />

          <div className="about-top-card">
            <span className="tape tape-left" />
            <div className="about-top-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  {t.about.kicker}
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                  {t.about.headingPre}{" "}
                  <span className="marker-highlight marker-lime">
                    {t.about.headingGrow}
                  </span>
                  .
                </h2>
              </div>

              <div className="about-stamp-card">
                <span className="about-stamp-label">{t.about.stampLabel}</span>
                <strong>{t.about.stampStrong}</strong>
                <p>{t.about.stampText}</p>
              </div>
            </div>
          </div>

          <div className="about-content-grid">
            <article className="about-story-card">
              <span className="tape" />
              <span className="about-pin" />

              <div className="about-story-kicker">{t.about.storyKicker}</div>

              <p className="about-lead-text">
                {t.about.leadPre}{" "}
                <span className="marker-highlight marker-purple">
                  {t.about.leadIdea}
                </span>{" "}
                {t.about.leadMid}{" "}
                <span className="marker-highlight marker-orange">
                  {t.about.leadKnow}
                </span>
              </p>

              <div className="about-divider" />

              <p>{t.about.p1}</p>

              <p>{t.about.p2}</p>

              <div className="about-quote-note">
                <span>{t.about.quoteSpan}</span>
                <p>{t.about.quoteText}</p>
              </div>
            </article>

            <aside className="about-board-card">
              <div className="about-board-line" />
              <div className="about-board-pin about-board-pin-one" />
              <div className="about-board-pin about-board-pin-two" />

              <div className="about-mini-note about-mini-note-one">
                <span className="tape" />
                <small>{t.about.beforeSmall}</small>
                <strong>{t.about.beforeStrong}</strong>
                <p>{t.about.beforeText}</p>
              </div>

              <div className="about-mini-note about-mini-note-two">
                <span className="tape" />
                <small>{t.about.afterSmall}</small>
                <strong>{t.about.afterStrong}</strong>
                <p>{t.about.afterText}</p>
              </div>

              <div className="about-center-badge">
                <span>{t.about.badge}</span>
              </div>
            </aside>
          </div>

          <div className="about-metrics-grid">
            {t.about.metrics.map((item, i) => (
              <div key={item.title} className={`about-metric-card ${["purple", "lime", "orange"][i]}`}>
                <span className="about-metric-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        id="why-us"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="why-shell mx-auto max-w-7xl">
          <div className="why-bg-orbit why-bg-orbit-one" aria-hidden="true" />
          <div className="why-bg-orbit why-bg-orbit-two" aria-hidden="true" />

          <div className="why-header-card">
            <span className="tape tape-left" />

            <div className="why-header-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  {t.why.kicker}
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
                  {t.why.headingPre}{" "}
                  <span className="marker-highlight marker-orange">
                    {t.why.headingGamble}
                  </span>
                  .
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                  {t.why.para}
                </p>
              </div>

              <div className="why-big-note">
                <span className="why-note-label">{t.why.noteLabel}</span>
                <strong>{t.why.noteStrong}</strong>
                <p>{t.why.noteText}</p>
              </div>
            </div>
          </div>

          <div className="why-board">
            <div className="why-board-line why-board-line-one" />
            <div className="why-board-line why-board-line-two" />

            <div className="why-board-pin why-board-pin-one" />
            <div className="why-board-pin why-board-pin-two" />
            <div className="why-board-pin why-board-pin-three" />

            <div className="why-cards-grid">
              {t.why.cards.map((card, index) => (
                <article
                  key={card.title}
                  className={`why-card why-card-${whyCardVisuals[index].tone} ${
                    index % 2 === 0 ? "why-tilt-left" : "why-tilt-right"
                  }`}
                >
                  <span className="tape" />

                  <div className="why-card-top">
                    <span className="why-card-icon" aria-hidden="true">{whyCardVisuals[index].icon}</span>
                    <span className="why-card-tag">{card.tag}</span>
                  </div>

                  <h3>{card.title}</h3>
                  <p>{card.text}</p>

                  <div className="why-card-footer">
                    <span>{t.why.cardNoDrama}</span>
                    <strong>{t.why.cardApproved}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="why-bottom-strip">
            {t.why.strip.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact-us"
        className="contact-section-v2 relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="contact-bg-grid" aria-hidden="true" />
        <div className="contact-shell-v2 mx-auto max-w-7xl">
          <div className="contact-layout-v2">
            <div className="contact-left-column">
              <div className="contact-hero-card-v2">
                <div className="contact-eyebrow-v2">
                  <span>✦</span>
                  {t.contact.eyebrow}
                </div>

                <h2>{t.contact.heading}</h2>

                <p>{t.contact.para}</p>

                <div className="contact-trust-row-v2">
                  {t.contact.trust.map((item) => (
                    <div key={item.step}>
                      <span>{item.step}</span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="contact-action-row-v2">
                  <a href="tel:+201148000500" className="contact-main-action-v2">
                    <span>☎</span>
                    {t.contact.callAction}
                  </a>
                  <a href="mailto:business@anovic.net" className="contact-secondary-action-v2">
                    <span>✉</span>
                    business@anovic.net
                  </a>
                </div>

                <div className="contact-social-panel-v2" aria-label="Social media links">
                  <span>{t.contact.follow}</span>
                  <div className="social-icon-list social-icon-list-dark">
                    {activeSocials.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={`Open ${social.label}`}
                        className="social-icon-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {social.paths.map((path) => (
                            <path key={path} d={path} />
                          ))}
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="contact-info-grid-v2">
                <article className="contact-info-card-v2">
                  <span className="contact-info-icon-v2">☎</span>
                  <div>
                    <span>{t.contact.phoneLabel}</span>
                    <a href="tel:+201148000500">01148000500</a>
                    <a href="tel:+201277140013">01277140013</a>
                    <a href="tel:+201285848332">01285848332</a>
                  </div>
                </article>

                <article className="contact-info-card-v2">
                  <span className="contact-info-icon-v2">✉</span>
                  <div>
                    <span>{t.contact.emailLabel}</span>
                    <a href="mailto:business@anovic.net">business@anovic.net</a>
                  </div>
                </article>

                <article className="contact-info-card-v2 contact-info-card-wide-v2">
                  <span className="contact-info-icon-v2">⌖</span>
                  <div>
                    <span>{t.contact.addressLabel}</span>
                    <p>{t.contact.address}</p>
                  </div>
                </article>
              </div>
            </div>

            <form
              className="contact-form-card-v2"
              onSubmit={handleContactSubmit}
            >
              {/* Honeypot: hidden from people, catches bots. FormSubmit drops the field. */}
              <input
                type="text"
                name="_honey"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
              />

              <div className="contact-form-head-v2">
                <div>
                  <span>{t.contact.formTag}</span>
                  <h3>{t.contact.formHeading}</h3>
                </div>
                <p>{t.contact.formHint}</p>
              </div>

              <div className="contact-field-grid-v2">
                <label className="contact-field-v2">
                  <span>{t.contact.fullName}</span>
                  <input
                    name="fullName"
                    type="text"
                    placeholder={t.contact.fullNamePh}
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>{t.contact.phone}</span>
                  <input
                    name="phone"
                    type="tel"
                    placeholder={t.contact.phonePh}
                    autoComplete="tel"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>{t.contact.emailField}</span>
                  <input
                    name="email"
                    type="email"
                    placeholder={t.contact.emailPh}
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>{t.contact.company}</span>
                  <input
                    name="company"
                    type="text"
                    placeholder={t.contact.companyPh}
                    autoComplete="organization"
                  />
                </label>
              </div>

              <div className="contact-service-panel-v2">
                <div className="contact-service-head-v2">
                  <span>{t.contact.serviceNeeded}</span>
                  <small>{t.contact.chooseOne}</small>
                </div>

                <div className="contact-service-list-v2">
                  {t.contact.services.map((service) => (
                    <label key={service}>
                      <input name="services" type="checkbox" value={service} />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="contact-field-v2 contact-field-full-v2">
                <span>{t.contact.budget}</span>
                <select className="list" name="budget" defaultValue="">
                  <option value="" disabled>
                    {t.contact.budgetPlaceholder}
                  </option>
                  {t.contact.budgets.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>

              <label className="contact-field-v2 contact-field-full-v2">
                <span>{t.contact.message}</span>
                <textarea
                  name="message"
                  rows={5}
                  placeholder={t.contact.messagePh}
                  required
                />
              </label>

              <button
                type="submit"
                className="contact-submit-btn-v2"
                disabled={contactStatus === "sending"}
              >
                <span>{contactStatus === "sending" ? t.contact.sending : t.contact.send}</span>
                <strong>→</strong>
              </button>

              {contactStatus !== "idle" && (
                <p
                  className={`mt-4 text-sm font-black ${
                    contactStatus === "success"
                      ? "text-lime-700"
                      : contactStatus === "sending"
                        ? "text-stone-500"
                        : "text-red-700"
                  }`}
                  role="status"
                >
                  {contactStatus === "success"
                    ? t.contact.success
                    : contactStatus === "sending"
                      ? t.contact.sendingMsg
                      : t.contact.error}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-v2 relative z-10">
        <div className="footer-shell-v2 mx-auto max-w-7xl px-4 py-12 sm:px-5 md:px-8">
          <div className="footer-top-v2">
            <div className="footer-brand-v2">
              <a href="#home" aria-label={t.a11y.home}>
                <img src="/logo white.png" alt="Anovic logo" loading="lazy" decoding="async" />
              </a>
              <p>{t.footer.brandText}</p>
            </div>

            <div className="footer-links-v2">
              <div>
                <h3>{t.footer.company}</h3>
                {navItems.map((link) => (
                  <a key={link.href} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>

              <div>
                <h3>{t.footer.servicesTitle}</h3>
                {t.contact.services.slice(0, 5).map((service) => (
                  <a key={service} href="#services">
                    {service}
                  </a>
                ))}
              </div>

              <div>
                <h3>{t.footer.contactTitle}</h3>
                <a href="tel:+201148000500">01148000500</a>
                <a href="tel:+201277140013">01277140013</a>
                <a href="tel:+201285848332">01285848332</a>
                <a href="mailto:business@anovic.net">business@anovic.net</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-v2">
            <p>© {new Date().getFullYear()} Anovic. {t.footer.rights}</p>
            <p>{t.contact.address}</p>
          </div>
        </div>
      </footer>

      <AnovicChat />

      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`scroll-top-btn ${showTop && !open ? "is-visible" : ""}`}
        aria-label={t.a11y.backToTop}
      >
        <span aria-hidden="true">↑</span>
      </button>
    </main>
  );
}
