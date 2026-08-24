"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Share2, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { WebStory } from "@/lib/store";

export default function VisualStoryViewer({ story }: { story: WebStory }) {
  const slides = story.slides && story.slides.length > 0
    ? story.slides
    : [{ image: story.image, title: story.title, caption: story.description ?? "", alt: story.title }];

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 5000; // 5s per slide like IndiaToday

  const next = useCallback(() => {
    setIdx((i) => {
      if (i < slides.length - 1) return i + 1;
      return i; // stay on last
    });
    setProgress(0);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
    setProgress(0);
  }, []);

  // Auto progress
  useEffect(() => {
    if (paused) return;
    if (idx >= slides.length - 1 && progress >= 100) return;
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        if (idx < slides.length - 1) {
          setIdx((i) => i + 1);
          setProgress(0);
        } else {
          // end
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    }, 30);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, paused, slides.length, progress]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Touch swipe
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 40) prev();
    else if (diff < -40) next();
    touchStart.current = null;
    setPaused(false);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title: story.title, url }); } catch { /* */ }
    } else if (url) {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  const slide = slides[idx];
  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 md:p-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.7), transparent)" }}>
        {/* Progress bars */}
        <div className="flex gap-1 mb-3">
          {slides.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%",
                  transition: i === idx && !paused ? "width 0.03s linear" : "none",
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Link href="/web-stories" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
              <ChevronLeft size={16} />
            </Link>
            <div className="hidden md:block">
              <div className="text-[11px] font-bold tracking-widest opacity-80">VISUAL STORIES</div>
              <div className="text-[13px] font-bold line-clamp-1 max-w-[320px]">{story.title}</div>
            </div>
            {story.category && <span className="hidden md:inline-flex rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{story.category}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaused((p) => !p)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button onClick={share} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
              <Share2 size={14} />
            </button>
            <Link href="/web-stories" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
              <X size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden bg-black"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Image */}
        <div className="relative h-[100dvh] w-full max-w-[420px] mx-auto bg-black flex flex-col">
          {slide.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.alt ?? slide.title ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-600" />
          )}
          {/* Gradient overlay for text readability — like IndiaToday */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.25) 45%, transparent 70%)" }} />

          {/* Content at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 text-white">
            {story.category && (
              <span className="mb-2 inline-flex rounded bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-black">
                {story.category}
              </span>
            )}
            <h1 className="text-[18px] md:text-[20px] font-extrabold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]">
              {slide.title || story.title}
            </h1>
            {slide.caption && (
              <p className="mt-2 text-[13px] leading-relaxed text-white/90 line-clamp-3 drop-shadow-[0_1px_4px_rgba(0,0,0,.5)]">
                {slide.caption}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/70">
              <span>{idx + 1} / {slides.length}</span>
              <span>Updated Bharat</span>
            </div>
          </div>

          {/* Tap areas */}
          <button
            aria-label="Previous"
            onClick={prev}
            disabled={idx === 0}
            className="absolute left-0 top-[56px] bottom-20 w-[30%] disabled:opacity-0"
          />
          <button
            aria-label="Next"
            onClick={next}
            className="absolute right-0 top-[56px] bottom-20 w-[70%]"
          />

          {/* Side arrows (desktop) */}
          <button
            onClick={prev}
            disabled={idx === 0}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            disabled={idx === slides.length - 1}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Bottom dots for mobile */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
        {slides.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
