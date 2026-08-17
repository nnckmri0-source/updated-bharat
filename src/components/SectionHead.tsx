import { ChevronRight, Grid3x3 } from "lucide-react";

export default function SectionHead({
  title,
  color = "var(--orange)",
  href,
  moreLabel = "More",
  icon,
}: {
  title: string;
  color?: string;
  href?: string;
  moreLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="section-head" style={color !== "var(--orange)" ? { borderTop: `3px solid ${color}` } : undefined}>
      <div className="section-head-title" style={color !== "var(--orange)" ? { color } : undefined}>
        {icon ?? <Grid3x3 size={14} />} {title}
      </div>
      {href && (
        <a href={href} className="section-head-more" style={{ textDecoration: "none" }}>
          {moreLabel} <ChevronRight size={12} />
        </a>
      )}
    </div>
  );
}
