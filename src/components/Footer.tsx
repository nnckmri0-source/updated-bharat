"use client";

import Link from "next/link";
import { ChevronRight, Link2, Grid3x3, Mail, MoreHorizontal } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import NewsletterForm from "@/components/NewsletterForm";
import { SocialButtons } from "@/components/SocialRow";

export default function Footer() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { channels, settings, footer } = data;
  const footerCategories = channels.filter((c) => footer.categorySlugs.includes(c.slug));

  return (
    <footer className="site-footer">
      {/* Brand Strip */}
      <div className="footer-brand-strip">
        <div className="container" style={{ maxWidth: 1560, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="footer-brand-name">{settings.name}</div>
          {settings.socialVisible !== false && <SocialButtons social={settings.social} variant="strip" />}
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="footer-body">
        <div className="container" style={{ maxWidth: 1560, margin: "0 auto", padding: "0 16px" }}>
          <div className="footer-grid">
            {/* Col 1: Brand + About */}
            <div>
              {settings.logo && <img src={settings.logo} alt={settings.name} style={{ height: 36, objectFit: "contain", marginBottom: 12 }} />}
              <div className="footer-heading" style={{ fontSize: "0.95rem" }}>{settings.name}</div>
              <p className="footer-about" style={{ marginTop: 4 }}>{settings.footerAbout}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {settings.socialVisible !== false && <SocialButtons social={settings.social} variant="strip" size={15} />}
              </div>
            </div>

            {/* Col 2: Quick Links + Categories — side by side */}
            <div className="footer-links-grid">
              <div>
                <div className="footer-heading">
                  <Link2 size={14} /> {t("quickLinks")}
                </div>
                {footer.quickLinks.map((l) => (
                  <Link key={l.title} href={l.href} className="footer-link"><ChevronRight size={12} /> {l.title}</Link>
                ))}
              </div>
              <div>
                <div className="footer-heading">
                  <Grid3x3 size={14} /> {t("categories")}
                </div>
                {footerCategories.map((c) => (
                  <a key={c.slug} href={`/channel/${c.slug}`} className="footer-link" style={{ color: "inherit", textDecoration: "none" }}><ChevronRight size={12} /> {c.name}</a>
                ))}
              </div>
            </div>

            {/* Col 3: Newsletter + More */}
            <div>
              <div className="footer-heading">
                <Mail size={14} /> {t("newsletter")}
              </div>
              <p className="footer-about" style={{ marginBottom: 12 }}>Get the latest news delivered straight to your inbox.</p>
              <NewsletterForm />
              <div style={{ marginTop: 16 }}>
                <div className="footer-heading" style={{ fontSize: "0.78rem" }}>
                  <MoreHorizontal size={14} /> {t("more")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {footer.tags.map((t) => (
                    <Link key={t.title} href={t.href} className="footer-tag-link">{t.title}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="container" style={{ maxWidth: 1560, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ margin: 0 }}>© 2026 <strong style={{ color: "#fff" }}>{settings.name}</strong>. {settings.copyright || t("rightsReserved")}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>
            Design &amp; Developed by{" "}
            <a href="https://zorvent.com" target="_blank" rel="noreferrer noopener" style={{ color: "var(--orange)", fontWeight: 800, letterSpacing: "0.3px" }}>
              ZORVENT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
