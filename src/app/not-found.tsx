import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ maxWidth: 640, margin: "0 auto", padding: "70px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "3.4rem", fontWeight: 900, color: "var(--orange)", lineHeight: 1 }}>404</div>
      <h1 style={{ fontWeight: 800, margin: "10px 0 8px" }}>Page not found</h1>
      <p style={{ color: "var(--text-muted)", margin: "0 0 22px" }}>
        This page was moved or deleted. Head back home for the latest stories.
      </p>
      <Link href="/" style={{ background: "var(--orange)", color: "#fff", padding: "11px 28px", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", display: "inline-block", textDecoration: "none" }}>
        ← Back to Homepage
      </Link>
    </div>
  );
}
