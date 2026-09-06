"use client";

import { useState } from "react";
import { X, Sparkles, Copy, Check, Lock, Globe, Share2, Loader2 } from "lucide-react";

interface PublishGalleryModalProps {
  eventId: string;
  eventName: string;
  selectedCount: number;
  existingGallery?: {
    slug: string;
    title: string;
    isPublished: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PublishGalleryModal({
  eventId,
  eventName,
  selectedCount,
  existingGallery,
  isOpen,
  onClose,
  onSuccess,
}: PublishGalleryModalProps) {
  const [title, setTitle] = useState(existingGallery?.title || `${eventName} Gallery`);
  const [pin, setPin] = useState("482917");
  const [slug, setSlug] = useState(existingGallery?.slug || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [publishedResult, setPublishedResult] = useState<{
    slug: string;
    accessPin: string;
    url: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  if (!isOpen) return null;

  const generateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(randomPin);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          pin,
          slug: slug.trim() ? slug.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to publish gallery");
        setIsSubmitting(false);
        return;
      }

      const fullUrl = `${window.location.origin}/gallery/${data.gallery.slug}`;
      setPublishedResult({
        slug: data.gallery.slug,
        accessPin: data.gallery.accessPin,
        url: fullUrl,
      });

      onSuccess();
    } catch {
      setError("Network failure while publishing gallery");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: "link" | "pin") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111726] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!publishedResult ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Publish Client Gallery</h3>
                <p className="text-xs text-slate-400">
                  Generate a protected, customer-facing link for this event
                </p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">Selected for Publishing:</span>
              <span className="font-semibold text-indigo-300">
                {selectedCount} photograph{selectedCount === 1 ? "" : "s"}
              </span>
            </div>

            {selectedCount === 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                ⚠️ No photos are currently selected! Please select photos from the event grid first
                before publishing.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gallery Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Arjun & Priya Wedding Highlights"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    <span>6-Digit Access PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="e.g. 482917"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono tracking-widest text-base text-center focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom URL Slug (Optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. abc123 or wedding-highlights"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Publish Gallery</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Screen with Credentials */
          <div className="text-center py-2 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Gallery Published Live!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this link and PIN with the customer to allow secure zero-account access
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-[10px] text-slate-400 block mb-1">Gallery Link:</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-indigo-300 font-mono truncate">
                    {publishedResult.url}
                  </span>
                  <button
                    onClick={() => copyToClipboard(publishedResult.url, "link")}
                    className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-[10px] text-slate-400 block mb-1">Customer Access PIN:</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg text-emerald-300 font-mono font-bold tracking-widest">
                    {publishedResult.accessPin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(publishedResult.accessPin, "pin")}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-white/10 transition-colors"
              >
                Done
              </button>
              <a
                href={`/gallery/${publishedResult.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>View Live Gallery</span>
                <Globe className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
