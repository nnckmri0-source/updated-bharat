"use client";

import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { useSiteData } from "@/lib/store";

const VOTE_KEY = "ub_poll_votes";

export default function PollWidget() {
  const { data } = useSiteData();
  const poll = data.polls.find((p) => p.published);
  const [selected, setSelected] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState(false);

  // Hydrate stored votes after mount (localStorage is client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOTE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration from localStorage after first paint
      if (raw) setVotes(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  if (!poll) return null;

  const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;

  const castVote = (opt: string) => {
    if (voted) return;
    const next = { ...votes, [opt]: (votes[opt] ?? 0) + 1 };
    setVotes(next);
    setSelected(opt);
    setVoted(true);
    try {
      localStorage.setItem(VOTE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const pct = (opt: string) => Math.round(((votes[opt] ?? 0) / total) * 100);

  return (
    <div className="widget-box mb-3">
      <div className="section-head">
        <div className="section-head-title" style={{ background: "var(--navy)" }}>
          <BarChart3 size={15} /> POLL
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <h6 style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.4, color: "var(--text)" }}>{poll.question}</h6>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {poll.options.map((opt) => {
            const p = pct(opt);
            const isSel = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => castVote(opt)}
                disabled={voted}
                style={{
                  position: "relative",
                  textAlign: "left",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${isSel ? "var(--orange)" : "var(--border)"}`,
                  background: voted ? "#fafafa" : "#fff",
                  cursor: voted ? "default" : "pointer",
                  overflow: "hidden",
                  fontFamily: "inherit",
                }}
              >
                {voted && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${p}%`,
                      background: isSel ? "rgba(244,114,22,.18)" : "rgba(26,26,46,.07)",
                      transition: "width .4s ease",
                    }}
                  />
                )}
                <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isSel && <CheckCircle2 size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />}
                    {opt}
                  </span>
                  {voted && <span style={{ fontSize: "0.72rem", fontWeight: 800, color: isSel ? "var(--orange)" : "var(--text-muted)" }}>{p}%</span>}
                </span>
              </button>
            );
          })}
        </div>
        {voted && (
          <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {total - 1} vote{total - 1 === 1 ? "" : "s"} · Thanks for voting!
          </p>
        )}
      </div>
    </div>
  );
}
