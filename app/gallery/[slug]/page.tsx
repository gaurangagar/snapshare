"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import {
  Lock,
  Calendar,
  MapPin,
  Camera,
  Download,
  Maximize2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import PhotoLightbox, { LightboxPhoto } from "@/components/PhotoLightbox";

interface GalleryMeta {
  id: string;
  slug: string;
  title: string;
  eventName: string;
  eventDate?: string;
  location?: string;
  photoCount: number;
  coverPhotoUrl?: string;
  isUnlocked: boolean;
}

interface PhotoData {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function CustomerGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [gallery, setGallery] = useState<GalleryMeta | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // PIN Form State
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/${slug}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        setIsUnlocked(true);
      }
    } catch {
      console.error("Failed to load gallery photos");
    }
  }, [slug]);

  const loadGallery = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/${slug}`);
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setGallery(data.gallery);

      if (data.gallery.isUnlocked) {
        setIsUnlocked(true);
        await loadPhotos();
      }
    } catch {
      console.error("Failed to load gallery info");
    } finally {
      setIsLoading(false);
    }
  }, [slug, loadPhotos]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // Handle PIN Digit Inputs
  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanValue;
    setPinDigits(newDigits);
    setPinError("");

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (cleanValue && index === 5 && newDigits.every((d) => d !== "")) {
      verifyPin(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (submittedPin?: string) => {
    const pin = submittedPin || pinDigits.join("");
    if (pin.length < 4) {
      setPinError("Please enter your complete access PIN");
      return;
    }

    setIsVerifying(true);
    setPinError("");

    try {
      const res = await fetch(`/api/gallery/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPinError(data.error || "Incorrect PIN. Access denied.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setIsVerifying(false);
        return;
      }

      setIsUnlocked(true);
      await loadPhotos();
    } catch {
      setPinError("Network failure while verifying access PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  const autoFillDemoPin = () => {
    const demo = ["4", "8", "2", "9", "1", "7"];
    setPinDigits(demo);
    verifyPin("482917");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Gallery Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          This gallery does not exist or has not been published by the lead photographer yet.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const lightboxPhotos: LightboxPhoto[] = photos.map((p) => ({
    id: p.id,
    filename: p.filename,
    storageUrl: p.storageUrl,
    fileSize: p.fileSize,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">SnapShare</span>
          </Link>

          <div className="flex items-center gap-3">
            {isUnlocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Client Access</span>
              </span>
            )}
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Photographer Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!isUnlocked ? (
          /* ================= PIN LOCKED SCREEN ================= */
          <div className="relative flex-1 flex items-center justify-center p-4 py-16 overflow-hidden">
            {/* Background Cover Image with Blur */}
            {gallery.coverPhotoUrl && (
              <div className="absolute inset-0 -z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery.coverPhotoUrl}
                  alt=""
                  className="w-full h-full object-cover blur-2xl scale-110 opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-[#090d16]/80 to-[#090d16]" />
              </div>
            )}

            <div
              className={`max-w-md w-full bg-[#111726]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6 ${
                shake ? "animate-shake" : ""
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                  Private Client Gallery
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">{gallery.title}</h1>
                <p className="text-xs text-slate-400">{gallery.eventName}</p>
              </div>

              {(gallery.eventDate || gallery.location) && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 pt-1">
                  {gallery.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(gallery.eventDate).toLocaleDateString()}</span>
                    </span>
                  )}
                  {gallery.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{gallery.location}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Demo Hint Helper */}
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between gap-2">
                <span className="text-slate-300 text-[11px]">
                  Demo Access PIN: <code className="text-indigo-300 font-bold">482917</code>
                </span>
                <button
                  type="button"
                  onClick={autoFillDemoPin}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow"
                >
                  Autofill & Unlock
                </button>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* 6-Digit PIN Keypad / Input */}
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-300">
                  Enter 6-Digit Gallery PIN
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 rounded-2xl bg-slate-900 border border-white/10 text-center text-xl font-bold font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                    />
                  ))}
                </div>

                <button
                  onClick={() => verifyPin()}
                  disabled={isVerifying || pinDigits.some((d) => !d)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Unlock Client Gallery</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Protected client portal. Contact the event organizer if you misplaced your access
                PIN.
              </p>
            </div>
          </div>
        ) : (
          /* ================= UNLOCKED GALLERY VIEW ================= */
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
            {/* Gallery Header Banner */}
            <div className="p-8 rounded-3xl bg-[#111726]/90 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  Published Photo Collection
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {gallery.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="text-slate-200 font-medium">{gallery.eventName}</span>
                  {gallery.eventDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(gallery.eventDate).toLocaleDateString()}</span>
                    </span>
                  )}
                  {gallery.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{gallery.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-200">
                  {photos.length} Photographs
                </span>
                {photos.length > 0 && (
                  <button
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Slideshow</span>
                  </button>
                )}
              </div>
            </div>

            {/* Photo Grid */}
            {photos.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[#111726]/40 border border-white/5 space-y-2">
                <h3 className="text-sm font-semibold text-white">No Published Photos Available</h3>
                <p className="text-xs text-slate-500">
                  The event organizer has not published selected photographs to this gallery yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-indigo-500/50 cursor-pointer aspect-[4/3] shadow-md transition-all duration-300 hover:scale-[1.02]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.storageUrl}
                      alt={photo.filename}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <span className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-200">
                        <span className="truncate max-w-[140px]">{photo.filename}</span>
                        <span className="flex items-center gap-1 text-indigo-300 font-medium">
                          <Download className="w-3 h-3" />
                          <span>View / Save</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
