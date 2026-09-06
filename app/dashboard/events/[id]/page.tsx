"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BatchUploader from "@/components/BatchUploader";
import PublishGalleryModal from "@/components/PublishGalleryModal";
import AddMemberModal from "@/components/AddMemberModal";
import PhotoLightbox, { LightboxPhoto } from "@/components/PhotoLightbox";
import {
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Square,
  Globe,
  Lock,
  Share2,
  Trash2,
  Maximize2,
  UserPlus,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

interface PhotoItem {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize: number;
  mimeType: string;
  isSelected: boolean;
  uploadedById: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

interface EventData {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  location?: string;
  coverPhotoUrl?: string;
  assignments: {
    user: { id: string; name: string; email: string };
  }[];
  galleries: {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
  }[];
}

export default function EventWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Modals
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filters
  const [filter, setFilter] = useState<"all" | "selected" | "mine">("all");
  const [copiedPin, setCopiedPin] = useState(false);

  const loadEventData = useCallback(async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Load Event
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (eventRes.status === 403) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }
      if (!eventRes.ok) {
        router.push("/dashboard");
        return;
      }
      const eventData = await eventRes.json();
      setEvent(eventData.event);

      // Load Photos
      const photosRes = await fetch(`/api/events/${eventId}/photos`);
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
      }
    } catch {
      console.error("Failed to load event workspace");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Photo Selection Toggle (Admin Only)
  const toggleSelect = async (photoId: string, currentState: boolean) => {
    if (user?.role !== "ADMIN") return;

    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, isSelected: !currentState } : p))
    );

    try {
      const res = await fetch(`/api/photos/${photoId}/select`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: !currentState }),
      });
      if (!res.ok) {
        // Rollback on error
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, isSelected: currentState } : p))
        );
      }
    } catch {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, isSelected: currentState } : p))
      );
    }
  };

  // Bulk Select / Deselect All
  const bulkToggleAll = async (selectValue: boolean) => {
    if (user?.role !== "ADMIN") return;

    // Optimistic update
    setPhotos((prev) => prev.map((p) => ({ ...p, isSelected: selectValue })));

    // Send updates in parallel
    for (const p of photos) {
      if (p.isSelected !== selectValue) {
        fetch(`/api/photos/${p.id}/select`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSelected: selectValue }),
        });
      }
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to remove this photograph?")) return;

    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        alert("Unable to delete photo: Insufficient permissions");
      }
    } catch {
      alert("Error removing photograph");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Security Check Display
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col text-slate-100">
        <Navbar user={user} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111726] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">403 Forbidden: Access Denied</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are signed in as a Team Member, but you have not been assigned to this event
              collection. Role-based isolation prevents unauthorized access.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Your Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const selectedPhotos = photos.filter((p) => p.isSelected);
  const gallery = event.galleries?.[0];

  const filteredPhotos = photos.filter((p) => {
    if (filter === "selected") return p.isSelected;
    if (filter === "mine") return p.uploadedById === user?.id;
    return true;
  });

  const lightboxPhotos: LightboxPhoto[] = filteredPhotos.map((p) => ({
    id: p.id,
    filename: p.filename,
    storageUrl: p.storageUrl,
    fileSize: p.fileSize,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Events Overview</span>
          </Link>
        </div>

        {/* Workspace Banner */}
        <div className="p-6 rounded-3xl bg-[#111726]/90 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {event.name}
              </h1>
              {gallery?.isPublished ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <Globe className="w-3 h-3" />
                  <span>Published Gallery</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-white/10">
                  <Lock className="w-3 h-3" />
                  <span>Unpublished Draft</span>
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {event.eventDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{event.assignments?.length || 0} Team Photographers</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => setMemberModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Team ({event.assignments?.length || 0})</span>
                </button>

                <button
                  onClick={() => setPublishModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>
                    {gallery?.isPublished ? "Manage Gallery & PIN" : "Publish Client Gallery"}
                  </span>
                </button>
              </>
            )}

            {gallery?.isPublished && (
              <Link
                href={`/gallery/${gallery.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Open Client View</span>
              </Link>
            )}
          </div>
        </div>

        {/* Live Published Gallery Banner for Admin */}
        {gallery?.isPublished && user?.role === "ADMIN" && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-emerald-300 block">
                  Gallery is Live & Protected with 6-Digit PIN
                </span>
                <span className="text-slate-400 text-[11px]">
                  Shareable Slug: <code className="text-white font-mono">{gallery.slug}</code> |
                  Demo PIN: <code className="text-white font-mono">482917</code>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/gallery/${gallery.slug}`);
                  setCopiedPin(true);
                  setTimeout(() => setCopiedPin(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                {copiedPin ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPin ? "Copied Link" : "Copy Client Link"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Batch Uploader Section */}
        <BatchUploader eventId={eventId} onUploadComplete={loadEventData} />

        {/* Photos Curation & Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Event Photograph Archive ({photos.length})
              </h2>
              <p className="text-xs text-slate-400">
                {user?.role === "ADMIN"
                  ? `Selected for publication: ${selectedPhotos.length} of ${photos.length} photos`
                  : "Collaborative event upload repository"}
              </p>
            </div>

            {/* Filter & Selection Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter tabs */}
              <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10 text-xs">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filter === "all" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({photos.length})
                </button>
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => setFilter("selected")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filter === "selected"
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Selected ({selectedPhotos.length})
                  </button>
                )}
                <button
                  onClick={() => setFilter("mine")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filter === "mine"
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  My Uploads
                </button>
              </div>

              {/* Admin Selection Helpers */}
              {user?.role === "ADMIN" && photos.length > 0 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                  <button
                    onClick={() => bulkToggleAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-white/10 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => bulkToggleAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-white/10 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photo Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#111726]/40 border border-white/5 text-xs text-slate-500">
              No photographs matching the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredPhotos.map((photo, index) => {
                const canDelete = user?.role === "ADMIN" || photo.uploadedById === user?.id;

                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 aspect-[4/3] ${
                      photo.isSelected
                        ? "border-indigo-500 shadow-md shadow-indigo-500/20"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.storageUrl}
                      alt={photo.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Admin Selection Checkbox (Top Left) */}
                    {user?.role === "ADMIN" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(photo.id, photo.isSelected);
                        }}
                        className={`absolute top-2.5 left-2.5 p-1.5 rounded-lg backdrop-blur-xs transition-all ${
                          photo.isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                            : "bg-black/50 text-slate-300 hover:text-white hover:bg-black/80 opacity-70 group-hover:opacity-100"
                        }`}
                        title={
                          photo.isSelected ? "Selected for Publishing" : "Click to Select for Gallery"
                        }
                      >
                        {photo.isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      photo.isSelected && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-semibold backdrop-blur-xs shadow">
                          Selected
                        </div>
                      )
                    )}

                    {/* Quick Lightbox Expand (Center) */}
                    <button
                      onClick={() => setLightboxIndex(index)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      title="Enlarge Photo"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Bottom Info & Delete Action */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-200">
                      <span className="truncate max-w-[120px] font-medium" title={photo.filename}>
                        {photo.uploadedBy.name}
                      </span>

                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                          className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-600 text-white transition-colors"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Publish Gallery Modal */}
      {publishModalOpen && (
        <PublishGalleryModal
          eventId={eventId}
          eventName={event.name}
          selectedCount={selectedPhotos.length}
          existingGallery={gallery}
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onSuccess={loadEventData}
        />
      )}

      {/* Add Member Modal */}
      {memberModalOpen && (
        <AddMemberModal
          eventId={eventId}
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          onMemberAdded={loadEventData}
        />
      )}
    </div>
  );
}
