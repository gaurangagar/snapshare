"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Plus,
  Users,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

interface EventItem {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  location?: string;
  coverPhotoUrl?: string;
  _count: {
    photos: number;
    assignments?: number;
  };
  assignments?: {
    user: { id: string; name: string; email: string };
  }[];
  galleries?: {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Event Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const eventsRes = await fetch("/api/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch {
      console.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
          location,
          coverPhotoUrl:
            coverPhotoUrl ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create event");
        setIsSubmitting(false);
        return;
      }

      setCreateModalOpen(false);
      setName("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setCoverPhotoUrl("");
      loadData();
    } catch {
      setError("Network error while creating event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const totalPhotos = events.reduce((sum, e) => sum + (e._count.photos || 0), 0);
  const publishedGalleriesCount = events.filter((e) =>
    e.galleries?.some((g) => g.isPublished)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User Role Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#111726]/80 border border-white/10 backdrop-blur-xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                Welcome back, {user?.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                  user?.role === "ADMIN"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {user?.role === "ADMIN" ? "Admin (Lead)" : "Team Member"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user?.role === "ADMIN"
                ? "You have full administrator access to create events, assign photographers, and publish customer galleries."
                : "You are currently viewing events assigned to your photography account."}
            </p>
          </div>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400">
              {user?.role === "ADMIN" ? "Active Events" : "Assigned Events"}
            </span>
            <div className="text-2xl font-bold text-white">{events.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400">Total Photos Uploaded</span>
            <div className="text-2xl font-bold text-indigo-400">{totalPhotos}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400">Published Client Galleries</span>
            <div className="text-2xl font-bold text-emerald-400">{publishedGalleriesCount}</div>
          </div>
        </div>

        {/* Events Grid Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {user?.role === "ADMIN" ? "All Event Collections" : "Your Assigned Events"}
              </h2>
              <p className="text-xs text-slate-400">
                Select an event to upload photos, curate selections, or manage access
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#111726]/40 border border-dashed border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Events Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {user?.role === "ADMIN"
                  ? "Click 'Create New Event' to start your first collaborative collection."
                  : "You have not been assigned to any events yet. Contact your lead photographer."}
              </p>
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create Event
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const gallery = event.galleries?.[0];
                const cover =
                  event.coverPhotoUrl ||
                  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="group rounded-3xl overflow-hidden bg-[#111726] border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                  >
                    {/* Cover Photo */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111726] via-transparent to-black/30" />

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {gallery?.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold shadow backdrop-blur-xs">
                            <Globe className="w-3 h-3" />
                            <span>Live Gallery</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 text-[10px] font-medium backdrop-blur-xs border border-white/10">
                            <Lock className="w-3 h-3" />
                            <span>Unpublished</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-slate-400">
                        {event.eventDate && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event._count.photos} Photos</span>
                          </div>

                          {event.assignments && event.assignments.length > 0 && (
                            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{event.assignments.length} Photographers</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform pt-1">
                        <span>Open Event Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111726] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Create New Event</h3>
                <p className="text-xs text-slate-400">Initialize a collaborative photography collection</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Royal Wedding: Arjun & Priya"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Grand celebration moments and ritual ceremonies"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. The Leela Palace, Udaipur"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cover Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={coverPhotoUrl}
                  onChange={(e) => setCoverPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
