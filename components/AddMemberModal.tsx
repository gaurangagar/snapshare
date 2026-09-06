"use client";

import { useState, useEffect, useCallback } from "react";
import { X, UserPlus, Users, Check, AlertCircle, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface AddMemberModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddMemberModal({
  eventId,
  isOpen,
  onClose,
  onMemberAdded,
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/members`);
      const data = await res.json();
      if (res.ok) {
        setAssignedMembers(data.assignments.map((a: { user: Member }) => a.user));
        setAvailableMembers(data.availableMembers || []);
      }
    } catch {
      console.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setError("");
      setSuccess("");
    }
  }, [isOpen, fetchMembers]);

  if (!isOpen) return null;

  const handleAssign = async (targetEmail?: string, targetUserId?: string) => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail || email.trim(),
          userId: targetUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to assign member");
      } else {
        setSuccess("Team member successfully assigned!");
        setEmail("");
        fetchMembers();
        onMemberAdded();
      }
    } catch {
      setError("Network error while assigning member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111726] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Event Team Members</h3>
            <p className="text-xs text-slate-400">Collaborative photographers & videographers</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Add by email form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAssign();
          }}
          className="space-y-3 mb-6"
        >
          <label className="block text-xs font-medium text-slate-300">
            Add Team Member by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. photographer2@snapshare.com"
              required
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Quick Add Available Members */}
        {availableMembers.length > 0 && (
          <div className="mb-5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Available Photographers ({availableMembers.length})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {availableMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                >
                  <div className="truncate">
                    <span className="font-medium text-slate-200 block truncate">{m.name}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{m.email}</span>
                  </div>
                  <button
                    onClick={() => handleAssign(undefined, m.id)}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors"
                  >
                    + Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currently Assigned */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Assigned Team Members ({assignedMembers.length})
          </span>
          {isLoading ? (
            <div className="text-center py-4 text-xs text-slate-500">Loading members...</div>
          ) : assignedMembers.length === 0 ? (
            <div className="text-center py-3 text-xs text-slate-500 italic bg-slate-900/40 rounded-xl">
              No team members assigned yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {assignedMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs"
                >
                  <div className="truncate">
                    <span className="font-medium text-slate-200 block truncate">{m.name}</span>
                    <span className="text-[10px] text-emerald-400 truncate block">{m.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
