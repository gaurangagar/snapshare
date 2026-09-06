import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import {
  Camera,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  HardDrive,
  Users,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar user={user} />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8">
          {/* Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-rose-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />

          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Photo Sharing & Publishing Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Collaborative Event Photos,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-rose-400 bg-clip-text text-transparent">
                Curated & Published
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
              Empower photography teams to collaboratively upload high-res photos, enable Leads to
              curate galleries with one click, and deliver PIN-protected client galleries with zero
              account friction.
            </p>

            {/* Quick Demo Launchpad Banner */}
            <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#111726]/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Instant Evaluation Launchpad</span>
                </div>
                <span className="text-[11px] text-slate-400">Pre-seeded demo accounts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Admin Card */}
                <Link
                  href="/login?role=admin"
                  className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-white/5 hover:border-amber-500/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Admin / Lead
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white">Gaurang Lead</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">admin@snapshare.com</p>
                  <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" /> Full Curation & Publish
                  </div>
                </Link>

                {/* Team Member Card */}
                <Link
                  href="/login?role=photographer"
                  className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-white/5 hover:border-emerald-500/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Team Member
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white">Arjun Photographer</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    photographer1@snapshare.com
                  </p>
                  <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Batch Upload Assigned
                  </div>
                </Link>

                {/* Customer Gallery Card */}
                <Link
                  href="/gallery/abc123"
                  className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 hover:border-indigo-400 text-left transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Customer Gallery
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white">Arjun & Priya Wedding</p>
                  <p className="text-[11px] text-indigo-300 font-mono mt-0.5">PIN: 482917</p>
                  <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-indigo-400" /> Zero Account Access
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950/40">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Architected for High-Performance Event Workflows
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Built to satisfy every security constraint, role boundary, and deliverable of the
                TrizenAI specification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Strict Role-Based Isolation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Admins assign photographers to specific events. Team members are strictly barred
                  from accessing unassigned events or publishing galleries (403 Forbidden enforcement).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Cloud Object Storage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Photographs are streamed to cloud object storage (S3 / R2) or managed local storage.
                  The database stores purely metadata, dimensions, and CDN storage paths.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#111726]/60 border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">PIN-Protected Client Portals</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clients receive a direct URL and 6-digit access PIN. Passcodes are hashed with
                  bcrypt, issuing signed session tokens to preview only curated, published photos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500 bg-[#090d16]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">SnapShare Platform</span>
          </div>
          <p>
            TrizenAI Full-Stack Internship Challenge — Submission for{" "}
            <code className="text-indigo-400 font-mono">talent@trizen-ai.com</code>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/gallery/abc123" className="hover:text-white transition-colors">
              Demo Gallery
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
