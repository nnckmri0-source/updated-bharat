import { FacebookIcon, XIcon, WhatsAppIcon } from "@/components/BrandIcons";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const encoded = encodeURIComponent(url);
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encoded}`;
  const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`;

  const btn = (bg: string, radius: string) => ({
    flex: 1,
    background: bg,
    color: "#fff",
    fontSize: "0.75rem",
    borderRadius: radius,
    padding: "10px 0",
    textAlign: "center" as const,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    textDecoration: "none",
  });

  return (
    <div style={{ display: "flex", gap: 0 }}>
      <a href={fb} target="_blank" rel="noreferrer" style={btn("#1877F2", "8px 0 0 8px")}>
        <FacebookIcon size={14} /> Facebook
      </a>
      <a href={tw} target="_blank" rel="noreferrer" style={btn("#000", "0")}>
        <XIcon size={13} /> Twitter
      </a>
      <a href={wa} target="_blank" rel="noreferrer" style={btn("#25D366", "0 8px 8px 0")}>
        <WhatsAppIcon size={14} /> WhatsApp
      </a>
    </div>
  );
}
