/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";
import "../test.css";
import "../careers.css";
import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnovicChat from "../components/AnovicChat";
import { useLanguage } from "../i18n/LanguageProvider";

// 👇 Paste the application link (Google Form, etc.) for each role.
// Order matches the role list in app/i18n/translations.ts (careers.roles).
const ROLE_LINKS: string[] = [
  "https://docs.google.com/forms/d/e/1FAIpQLSfWidQ1U5FyqcisVZbZyImhPc1wZZU76Cg6N1_QNm_wFR_IgQ/viewform?usp=sharing&ouid=105094235179513736504", // Content Creator
  "https://docs.google.com/forms/d/e/1FAIpQLSdDVa1DBKl9wntiljOCQUerKlQ69wwLOcaJDUlOFWGm3dwo4w/viewform", // Account / Social Media Manager
  "https://docs.google.com/forms/d/e/1FAIpQLSdmS7GGcO7HOku3QkVIEJN_w8S4827ViTQBTZM1wCdOsMoy5Q/viewform?usp=sharing&ouid=105094235179513736504https://forms.gle/your-form-id", // Graphic Designer
  "https://docs.google.com/forms/d/e/1FAIpQLSc4GdfXKjHTV1mYdFDvSj7PFNuXpKYbGVL2UjAbDYfdbEVu-A/viewform", // Media Buyer
  "https://docs.google.com/forms/d/e/1FAIpQLSdiRCDcXldGdDKDN6TvZB1eiauVtkgJW0LjAwUqpcrxuZZR4Q/viewform?usp=sharing&ouid=105094235179513736504", // Sales
  "https://docs.google.com/forms/d/e/1FAIpQLSccToN5hLGIqFmHaOqx4fQx3lnFJ_10pabOwyakE_E2IRbTJg/viewform", // Business Developer
  "https://docs.google.com/forms/d/e/1FAIpQLSezHF3-__S3ytODSAzFe1ArhuDCX-sZ_OkNriBKZznnbht3hw/viewform", // Operations
  "https://docs.google.com/forms/d/e/1FAIpQLScNDwHVV_4Wb8o3lvuHBiFFlcufEe6Wr1aNaY6cBWo6m4k4dQ/viewform", // Moderator
  "https://docs.google.com/forms/d/e/1FAIpQLSdMfc9X45Y1LH38niwF-NC7hvw3NUw581HLCE33ksa2uTg-Vg/viewform", // Tech
  "https://docs.google.com/forms/d/e/1FAIpQLSfGvo7Pqtyc3WkJHe0Hs0RqBpHKiIbv6pF3NZBlbgNeXKDYhA/viewform", // Video Editor
];

// Visual icon per role (language-neutral, matches the order above).
const ROLE_ICONS = ["✍️", "📱", "🎨", "📈", "🤝", "🚀", "👥", "🧮", "⚙️", "🛡️", "📸", "💻", "🎬"];

export default function CareersPage() {
  const { t, dir } = useLanguage();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="paper-app min-h-screen overflow-hidden text-stone-950" dir={dir}>
      <div className="paper-world-bg" aria-hidden="true" />

      <SiteHeader homePath="/" />

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-5 sm:pt-32 md:px-8 lg:pb-28">
        <div className="careers-shell">
          <div className="careers-orbit careers-orbit-one" aria-hidden="true" />
          <div className="careers-orbit careers-orbit-two" aria-hidden="true" />

          <div className="careers-head-card">
            <span className="tape tape-left" />

            <div className="careers-head-grid">
              <div className="careers-head-copy">
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  {t.careers.kicker}
                </p>

                <h1>{t.careers.heading}</h1>
                <p>{t.careers.subtitle}</p>
              </div>

              <aside className="careers-head-badge" aria-hidden="true">
                <span className="careers-badge-stars">
                  <span />
                  <span />
                  <span />
                </span>
                <strong>{t.careers.roles.length}</strong>
                <span className="careers-badge-label">{t.careers.openings}</span>
              </aside>
            </div>
          </div>

          <div className="careers-openings-row">
            <h2>{t.careers.pickRole}</h2>
            <span className="careers-count">{t.careers.roles.length}</span>
            <span>{t.careers.pickRoleHint}</span>
          </div>

          <div className="role-grid">
            {t.careers.roles.map((role, index) => (
              <a
                key={role}
                href={ROLE_LINKS[index] ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="role-card"
                aria-label={`${role} — ${t.careers.apply}`}
              >
                <span className="role-card-ico" aria-hidden="true">
                  {ROLE_ICONS[index]}
                  <i className="role-card-no">{String(index + 1).padStart(2, "0")}</i>
                </span>

                <span className="role-card-text">
                  <strong className="role-card-name">{role}</strong>
                  <small className="role-card-apply">
                    {t.careers.apply}
                    <span aria-hidden="true">↗</span>
                  </small>
                </span>

                <span className="role-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>

          <div className="careers-note-card">
            <span aria-hidden="true">✦</span>
            <p>{t.careers.note}</p>
          </div>

          <a href="/" className="careers-back">
            <span aria-hidden="true">{dir === "rtl" ? "→" : "←"}</span>
            {t.careers.backHome}
          </a>
        </div>
      </section>

      <SiteFooter homePath="/" />

      <AnovicChat />

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`scroll-top-btn ${showTop ? "is-visible" : ""}`}
        aria-label={t.a11y.backToTop}
      >
        <span aria-hidden="true">↑</span>
      </button>
    </main>
  );
}
