"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("done");
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <form className="footer-newsletter-form" onSubmit={onSubmit}>
      <input type="email" placeholder="Your email address..." required />
      <button type="submit">
        <Send size={12} /> {status === "done" ? "Subscribed ✓" : "Subscribe"}
      </button>
    </form>
  );
}
