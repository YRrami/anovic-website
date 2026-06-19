"use client";
import { useLanguage } from "../i18n/LanguageProvider";

const navHrefs = ["#home", "#services", "#our-work", "#about", "#why-us", "#contact-us"];

export default function SiteFooter({ homePath = "" }: { homePath?: string }) {
  const { t } = useLanguage();

  const navItems = [
    { label: t.nav.home, href: `${homePath}${navHrefs[0]}` },
    { label: t.nav.services, href: `${homePath}${navHrefs[1]}` },
    { label: t.nav.work, href: `${homePath}${navHrefs[2]}` },
    { label: t.nav.about, href: `${homePath}${navHrefs[3]}` },
    { label: t.nav.why, href: `${homePath}${navHrefs[4]}` },
    { label: t.nav.contact, href: `${homePath}${navHrefs[5]}` },
  ];

  return (
    <footer className="footer-v2 relative z-10">
      <div className="footer-shell-v2 mx-auto max-w-7xl px-4 py-12 sm:px-5 md:px-8">
        <div className="footer-top-v2">
          <div className="footer-brand-v2">
            <a href={homePath || "#home"} aria-label={t.a11y.home}>
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
                <a key={service} href={`${homePath}#services`}>
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
  );
}
