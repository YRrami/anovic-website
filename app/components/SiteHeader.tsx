"use client";
import "../i18n.css";
import { type CSSProperties, useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageProvider";

const navHrefs = ["#home", "#services", "#our-work", "#about", "#why-us", "#contact-us"];

// `homePath` lets this header live on other routes: on the home page it's ""
// (same-page hash links), on /careers it's "/" so links return home first.
export default function SiteHeader({ homePath = "" }: { homePath?: string }) {
  const { t, dir } = useLanguage();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: t.nav.home, href: `${homePath}${navHrefs[0]}` },
    { label: t.nav.services, href: `${homePath}${navHrefs[1]}` },
    { label: t.nav.work, href: `${homePath}${navHrefs[2]}` },
    { label: t.nav.about, href: `${homePath}${navHrefs[3]}` },
    { label: t.nav.why, href: `${homePath}${navHrefs[4]}` },
    { label: t.nav.contact, href: `${homePath}${navHrefs[5]}` },
  ];

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

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full px-3 pt-3 sm:px-4 sm:pt-5">
        <div className="glass-orbit-header mx-auto max-w-7xl">
          <a href={homePath || "#home"} className="brand-orbit group" aria-label={t.a11y.home}>
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

            <a href={`${homePath}#contact-us`} className="header-glow-cta hidden lg:inline-flex">
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
                href={homePath || "#home"}
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
                href={`${homePath}#contact-us`}
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
    </>
  );
}
