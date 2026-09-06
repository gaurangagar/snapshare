"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, Play, Pause, ZoomIn, ZoomOut } from "lucide-react";

export interface LightboxPhoto {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize?: number;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    setZoom(1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setZoom(1);
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPlaying, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  const handleDownload = async () => {
    if (!currentPhoto) return;
    try {
      const response = await fetch(currentPhoto.storageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentPhoto.filename || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(currentPhoto.storageUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none">
      {/* Top control bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 z-10 bg-black/40">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">
            {currentIndex + 1} <span className="text-slate-500">/</span> {photos.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-xs">
            {currentPhoto?.filename}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Slideshow */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying ? "text-indigo-400 bg-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title={isPlaying ? "Pause Slideshow" : "Start Slideshow"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
            title="Download High-Res Photo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors ml-2"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main viewer */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white backdrop-blur-sm transition-all hover:scale-110"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white backdrop-blur-sm transition-all hover:scale-110"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Current Image */}
        {currentPhoto && (
          <div
            className="transition-transform duration-200 max-w-full max-h-full flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.storageUrl}
              alt={currentPhoto.filename}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-opacity duration-300 select-none pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="h-20 bg-black/60 border-t border-white/10 px-4 flex items-center gap-2 overflow-x-auto z-10 py-2">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setZoom(1);
                setCurrentIndex(idx);
              }}
              className={`relative flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-indigo-500 scale-105 shadow-md shadow-indigo-500/30"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.storageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
