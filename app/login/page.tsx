"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Camera, Lock, Mail, User, Shield, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const presetRole = searchParams.get("role");

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEAM_MEMBER">("TEAM_MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Preset credentials based on query param
  useEffect(() => {
    if (presetRole === "admin") {
      setEmail("admin@snapshare.com");
      setPassword("Admin@123456");
      setActiveTab("login");
    } else if (presetRole === "photographer") {
      setEmail("photographer1@snapshare.com");
      setPassword("Photo@123456");
      setActiveTab("login");
    }
  }, [presetRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      activeTab === "login" ? { email, password } : { name, email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network failure during authentication");
      setIsLoading(false);
    }
  };

  const autofill = (type: "admin" | "photographer") => {
    if (type === "admin") {
      setEmail("admin@snapshare.com");
      setPassword("Admin@123456");
    } else {
      setEmail("photographer1@snapshare.com");
      setPassword("Photo@123456");
    }
    setActiveTab("login");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090d16] text-slate-100 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SnapShare</span>
        </Link>
        <p className="text-xs text-slate-400">
          Sign in to access your photography events and galleries
        </p>
      </div>

      {/* Demo Credentials Quick-Fill Bar */}
      <div className="max-w-md w-full mb-5 p-3 rounded-2xl bg-[#111726]/80 border border-white/10 text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
        <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Demo:</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => autofill("admin")}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] border border-amber-500/30 transition-colors"
          >
            Admin (Lead)
          </button>
          <button
            type="button"
            onClick={() => autofill("photographer")}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30 transition-colors"
          >
            Photographer
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-md w-full bg-[#111726] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "register"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Gaurang Agarwal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@snapshare.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {activeTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("TEAM_MEMBER")}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    role === "TEAM_MEMBER"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Photographer (Team)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    role === "ADMIN"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Admin / Lead
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{activeTab === "login" ? "Sign In to Workspace" : "Create Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <Link
            href="/gallery/abc123"
            className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
          >
            Are you a customer? <span className="underline">Unlock gallery with PIN →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16]" />}>
      <LoginForm />
    </Suspense>
  );
}
