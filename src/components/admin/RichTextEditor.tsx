"use client";

import { useRef, useState, useEffect } from "react";
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, Link2, Image as ImageIcon, Video, Quote, List, ListOrdered, Loader2 } from "lucide-react";
import { compressImage, uploadCompressedImage } from "@/lib/image-compress";

type Props = {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showImg, setShowImg] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [showYT, setShowYT] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState("");

  // Sync external value to editor on mount & when value changes externally (avoid loop)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only sync if different and editor not focused
    if (document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current?.innerHTML ?? "");
  };

  const wrapBlock = (tag: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || "Heading text";
    const html = `<${tag}>${escapeHtml(selectedText)}</${tag}>`;
    // delete selected and insert
    range.deleteContents();
    const frag = range.createContextualFragment(html);
    range.insertNode(frag);
    // move cursor after
    sel.collapseToEnd();
    onChange(ref.current?.innerHTML ?? "");
  };

  const insertLink = () => {
    const href = prompt("Enter URL (https://…)");
    if (!href) return;
    exec("createLink", href);
  };

  const insertImage = () => {
    if (!imgUrl.trim()) return;
    const alt = escapeAttr(imgAlt.trim());
    const cap = escapeHtml(imgCaption.trim());
    const fig = `<figure class="editor-figure" contenteditable="false" style="margin:12px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><img src="${escapeAttr(imgUrl.trim())}" alt="${alt}" style="width:100%;display:block" /><${cap ? `figcaption style="padding:6px 10px;font-size:12px;color:#64748b;background:#f8fafc">${cap}</figcaption>` : `div style="display:none"></div>`}></figure><p><br/></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, fig);
    onChange(ref.current?.innerHTML ?? "");
    setShowImg(false);
    setImgUrl("");
    setImgAlt("");
    setImgCaption("");
  };

  const onImgFile = async (file?: File | null) => {
    if (!file) return;
    setImgErr("");
    setImgBusy(true);
    try {
      // Compress hard (~15KB WebP) then upload to Firebase Storage → URL.
      const dataUrl = await compressImage(file, "content");
      let final = dataUrl;
      try {
        final = await uploadCompressedImage(dataUrl, file.name, "content");
      } catch {
        // Storage unavailable — keep the compressed data-URL so upload still works.
      }
      setImgUrl(final);
    } catch (e) {
      setImgErr((e as Error).message || "Image could not be processed");
    } finally {
      setImgBusy(false);
    }
  };

  const insertYoutube = () => {
    if (!ytUrl.trim()) return;
    const id = ytId(ytUrl.trim());
    const src = id ? `https://www.youtube.com/embed/${id}` : ytUrl.trim();
    const html = `<div data-youtube="${escapeAttr(ytUrl.trim())}" style="margin:12px 0;border-radius:10px;overflow:hidden;aspect-ratio:16/9;background:#000"><iframe src="${escapeAttr(src)}" style="width:100%;height:100%;border:none" allowfullscreen loading="lazy"></iframe></div><p><br/></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(ref.current?.innerHTML ?? "");
    setShowYT(false);
    setYtUrl("");
  };

  const onInput = () => onChange(ref.current?.innerHTML ?? "");

  return (
    <div className="rounded-xl border border-slate-300 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
        <ToolBtn onClick={() => wrapBlock("h1")} title="H1"><Heading1 size={16} /></ToolBtn>
        <ToolBtn onClick={() => wrapBlock("h2")} title="H2"><Heading2 size={16} /></ToolBtn>
        <ToolBtn onClick={() => wrapBlock("h3")} title="H3"><Heading3 size={16} /></ToolBtn>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold size={16} /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic size={16} /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline size={16} /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote size={16} /></ToolBtn>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list"><List size={16} /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered size={16} /></ToolBtn>
        <ToolBtn onClick={insertLink} title="Link"><Link2 size={16} /></ToolBtn>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolBtn onClick={() => setShowImg((v) => !v)} title="Image with caption"><ImageIcon size={16} /></ToolBtn>
        <ToolBtn onClick={() => setShowYT((v) => !v)} title="YouTube"><Video size={16} /></ToolBtn>
      </div>

      {/* Image dialog */}
      {showImg && (
        <div className="border-b border-slate-200 bg-white p-3 space-y-2">
          <div className="text-[12px] font-bold text-slate-700">Insert Image — with Alt & Caption</div>
          <div className="flex gap-2">
            <input type="text" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Image URL or upload" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500" />
            <label className={`shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 ${imgBusy ? "opacity-60 pointer-events-none" : ""}`}>
              {imgBusy ? <span className="inline-flex items-center gap-1"><Loader2 size={13} className="animate-spin" /> Uploading…</span> : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void onImgFile(e.target.files?.[0])} />
            </label>
          </div>
          {imgErr && <div className="text-[12px] font-medium text-red-500">{imgErr}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="text" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} placeholder="Alt text (SEO & accessibility)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500" />
            <input type="text" value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} placeholder="Caption shown below image" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={insertImage} disabled={!imgUrl.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50">Insert</button>
            <button type="button" onClick={() => setShowImg(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">Cancel</button>
          </div>
          {imgUrl && <img src={imgUrl} alt="preview" className="mt-2 h-24 rounded border object-cover" />}
        </div>
      )}

      {showYT && (
        <div className="border-b border-slate-200 bg-white p-3 space-y-2">
          <div className="text-[12px] font-bold text-slate-700">Embed YouTube</div>
          <input type="text" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500" />
          <div className="flex gap-2">
            <button type="button" onClick={insertYoutube} disabled={!ytUrl.trim()} className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50">Embed</button>
            <button type="button" onClick={() => setShowYT(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Editable */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onBlur={onInput}
        data-placeholder={placeholder}
        className="min-h-[260px] max-h-[520px] overflow-y-auto px-4 py-3 text-[14px] leading-7 text-slate-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 prose prose-sm max-w-none"
        style={{ wordBreak: "break-word" }}
      />

      <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
        Tip: Select text then click <b>B</b> / <i>I</i> / H1-H3. Images inserted above support <b>alt</b> &amp; <b>caption</b>. Paste YouTube link via YouTube button.
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </button>
  );
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}
