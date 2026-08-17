"use client";

import { useRef, useState } from "react";
import { Upload, X, Save } from "lucide-react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition";

export function TInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  const input = <input type={type} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  return label ? (
    <Field label={label} hint={hint}>
      {input}
    </Field>
  ) : (
    input
  );
}

export function TArea({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const area = <textarea className={inputCls} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  return label ? (
    <Field label={label} hint={hint}>
      {area}
    </Field>
  ) : (
    area
  );
}

export function TSelect({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const select = (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  return label ? <Field label={label}>{select}</Field> : select;
}

/** URL/text input + file upload (becomes base64 data-URL) + live preview. */
export function ImageInput({
  label,
  value,
  onChange,
  hint,
  previewHeight = 64,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  previewHeight?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tooBig, setTooBig] = useState(false);

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (file.size > 900 * 1024) {
      setTooBig(true);
      return;
    }
    setTooBig(false);
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className="block text-[13px] font-semibold text-slate-700 mb-1">{label}</span>
      <div className="flex gap-2">
        <input
          type="text"
          className={inputCls}
          value={value}
          placeholder="/uploads/...  ya  https://..."
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          title="Upload image (saved as base64)"
        >
          <Upload size={14} /> Upload
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 text-slate-400 hover:text-red-500"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {tooBig && <span className="block text-[11px] text-red-500 mt-1">Image too large (max 900KB) — paste a URL instead.</span>}
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt="preview"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
            style={{ height: previewHeight, maxWidth: 180, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
        </div>
      )}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </div>
  );
}

export function Card({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const size = small ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";
  const variants: Record<string, string> = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
    ghost: "text-slate-500 hover:text-slate-800",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${size} ${variants[variant]}`}>
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}

/** Quick save button bar used by settings-like sections. */
export function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Btn onClick={onSave}>
        <Save size={14} /> Save Changes
      </Btn>
      {saved && <span className="text-[13px] font-medium text-green-600">Saved ✓ — live on the site now</span>}
    </div>
  );
}
