"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface UploadFileItem {
  file: File;
  id: string;
  previewUrl: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
}

interface BatchUploaderProps {
  eventId: string;
  onUploadComplete: () => void;
}

export default function BatchUploader({ eventId, onUploadComplete }: BatchUploaderProps) {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: UploadFileItem[] = [];

    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      newItems.push({
        file,
        id: Math.random().toString(36).substring(2, 9),
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      });
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
  };

  const uploadAll = async () => {
    const pendingItems = items.filter((i) => i.status === "pending" || i.status === "error");
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    const formData = new FormData();
    pendingItems.forEach((item) => {
      formData.append("photos", item.file);
    });

    // Mark items uploading
    setItems((prev) =>
      prev.map((i) =>
        pendingItems.some((pi) => pi.id === i.id) ? { ...i, status: "uploading" } : i
      )
    );

    try {
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            pendingItems.some((pi) => pi.id === i.id) ? { ...i, status: "success" } : i
          )
        );
        onUploadComplete();
      } else {
        setItems((prev) =>
          prev.map((i) =>
            pendingItems.some((pi) => pi.id === i.id)
              ? { ...i, status: "error", errorMessage: data.error || "Upload failed" }
              : i
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          pendingItems.some((pi) => pi.id === i.id)
            ? { ...i, status: "error", errorMessage: "Network failure during upload" }
            : i
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="bg-[#111726] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span>Upload Event Photographs</span>
          </h3>
          <p className="text-xs text-slate-400">
            Drag & drop high-resolution photographs to submit for this event
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              Clear Queue
            </button>
            <button
              onClick={uploadAll}
              disabled={isUploading || pendingCount === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading {pendingCount}...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload {pendingCount} Photo{pendingCount === 1 ? "" : "s"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
            : "border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <ImageIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-200">
          Click or drop photos here to begin uploading
        </p>
        <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 50MB each</p>
      </div>

      {/* Queue items */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
            <span>Upload Queue ({items.length})</span>
            <div className="flex items-center gap-3">
              {successCount > 0 && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {successCount} Uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorCount} Failed
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900 aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />

                {/* Status Overlay */}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                )}
                {item.status === "success" && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-emerald-500/90 text-white shadow">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                {item.status === "error" && (
                  <div
                    className="absolute inset-0 bg-rose-950/80 p-2 flex flex-col items-center justify-center text-center"
                    title={item.errorMessage}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 mb-1" />
                    <span className="text-[10px] text-rose-200 line-clamp-2">
                      {item.errorMessage || "Failed"}
                    </span>
                  </div>
                )}

                {item.status === "pending" && !isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
