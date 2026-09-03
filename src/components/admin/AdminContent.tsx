"use client";

import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { syncSanityTicker, notifySync } from "@/lib/sanity-admin";
import { Card, Btn, TArea } from "./ui";

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export default function AdminContent() {
  const { data, update } = useSiteData();
  const [tickerText, setTickerText] = useState(toLines(data.ticker));
  const [trendingText, setTrendingText] = useState(toLines(data.trending));
  const [saved, setSaved] = useState(false);

  const save = () => {
    const ticker = fromLines(tickerText);
    const trending = fromLines(trendingText);
    update((d) => ({ ...d, ticker, trending }));
    notifySync(syncSanityTicker(ticker, trending), "Ticker");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <Card
        title="Breaking News Ticker"
        subtitle="The scrolling headlines at the very top (desktop) — one item per line."
        actions={
          <Btn variant="secondary" small onClick={() => setTickerText(toLines(data.ticker))}>
            <RotateCcw size={12} /> Reset
          </Btn>
        }
      >
        <TArea value={tickerText} onChange={setTickerText} rows={8} placeholder={"Cybersecurity Threats on the Rise\nBudget 2026: Key Highlights\n…"} />
      </Card>

      <Card
        title="Trending Keywords"
        subtitle="Shown in the mobile trending bar, search overlay and search suggestions — one per line."
        actions={
          <Btn variant="secondary" small onClick={() => setTrendingText(toLines(data.trending))}>
            <RotateCcw size={12} /> Reset
          </Btn>
        }
      >
        <TArea value={trendingText} onChange={setTrendingText} rows={5} placeholder={"IPL 2026\nElection Results\n…"} />
      </Card>

      <div className="flex items-center gap-3">
        <Btn onClick={save}>
          <Save size={14} /> Save Ticker & Trending
        </Btn>
        {saved && <span className="text-[13px] font-medium text-green-600">Saved ✓ — live on the site now</span>}
      </div>
    </div>
  );
}
