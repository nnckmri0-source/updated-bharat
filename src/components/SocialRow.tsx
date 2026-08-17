"use client";

import { FacebookIcon, XIcon, InstagramIcon, YouTubeIcon, WhatsAppIcon } from "@/components/BrandIcons";

type Social = { facebook: string; twitter: string; instagram: string; youtube: string; whatsapp: string };

const ITEMS = [
  { key: "facebook", label: "Facebook", bg: "#1877f2", Icon: FacebookIcon },
  { key: "twitter", label: "X (Twitter)", bg: "#000", Icon: XIcon },
  { key: "instagram", label: "Instagram", bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", Icon: InstagramIcon },
  { key: "whatsapp", label: "WhatsApp", bg: "#25D366", Icon: WhatsAppIcon },
  { key: "youtube", label: "YouTube", bg: "#ff0000", Icon: YouTubeIcon },
] as const;

export function SocialButtons({ social, variant = "sidebar", size = 16 }: { social: Social; variant?: "sidebar" | "strip"; size?: number }) {
  if (variant === "strip") {
    return (
      <div className="footer-strip-social" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {ITEMS.map(({ key, label, bg, Icon }) => (
          <a key={key} href={social[key]} target="_blank" className="footer-strip-icon" style={{ background: bg }} title={label} rel="noreferrer">
            <Icon size={size} />
          </a>
        ))}
      </div>
    );
  }
  return (
    <div className="sidebar-social-icons">
      {ITEMS.map(({ key, label, bg, Icon }) => (
        <a key={key} href={social[key]} target="_blank" className="sidebar-social-btn" style={{ background: bg }} title={label} rel="noreferrer">
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
