"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Sparkles, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || "Gagal");
        setLoading(false);
        return;
      }
      window.dispatchEvent(new Event("auth-changed"));
      const role = j.user?.role;
      if (role === "admin" || role === "kasir") router.push("/admin");
      else router.push(mode === "register" ? "/loyalty" : "/menu");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah");
      setLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) {
        // seed dulu lalu coba lagi
        await fetch("/api/seed", { method: "POST" });
        const r2 = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const j2 = await r2.json();
        if (!r2.ok) {
          setError(j2.error || "Gagal");
          setLoading(false);
          return;
        }
        window.dispatchEvent(new Event("auth-changed"));
        router.push(j2.user?.role === "customer" ? "/menu" : "/admin");
        router.refresh();
        return;
      }
      window.dispatchEvent(new Event("auth-changed"));
      router.push(j.user?.role === "customer" ? "/menu" : "/admin");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute left-1/4 top-20 text-7xl opacity-20 animate-floaty">🍛</div>
      <div className="absolute right-[12%] bottom-24 text-6xl opacity-20 animate-floaty" style={{ animationDelay: "-2s" }}>🌶️</div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-strong rounded-3xl p-8 hidden md:flex flex-col justify-between overflow-hidden relative"
        >
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl" />
          <div>
            <p className="text-6xl">🍛</p>
            <h1 className="mt-4 text-3xl font-black leading-tight">
              Gabung Keluarga{" "}
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                RM Flamboyan by Pak De Dargogo
              </span>
            </h1>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "🎁 Bonus 50 poin pendaftaran",
                "⭐ Rp 10.000 = 1 poin loyalty",
                "🏆 Naik level hingga Berlian",
                "🎮 Bonus poin dari game anak",
                "📱 Lacak pesanan real-time",
              ].map((t, i) => (
                <li key={i} className="glass-soft rounded-xl px-4 py-2.5">{t}</li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-xs text-slate-500">Sudah 12.400+ pelanggan bergabung 🎉</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-strong rounded-3xl p-6 sm:p-8"
        >
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Masuk" : "Daftar Baru"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</span>
                <div className="mt-1.5 flex items-center gap-2 glass-soft rounded-xl px-4 focus-within:border-amber-400/50 transition">
                  <User size={18} className="text-slate-500 shrink-0" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="cth: Siti Rahma"
                    className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
            )}
            <label className="block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
              <div className="mt-1.5 flex items-center gap-2 glass-soft rounded-xl px-4 focus-within:border-amber-400/50 transition">
                <Mail size={18} className="text-slate-500 shrink-0" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
            {mode === "register" && (
              <label className="block">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. HP (opsional)</span>
                <div className="mt-1.5 flex items-center gap-2 glass-soft rounded-xl px-4 focus-within:border-amber-400/50 transition">
                  <Phone size={18} className="text-slate-500 shrink-0" />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
            )}
            <label className="block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</span>
              <div className="mt-1.5 flex items-center gap-2 glass-soft rounded-xl px-4 focus-within:border-amber-400/50 transition">
                <Lock size={18} className="text-slate-500 shrink-0" />
                <input
                  required
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
                />
                <button type="button" onClick={() => setShow(!show)} className="text-slate-500">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
                ⚠️ {error}
              </div>
            )}

            <button
              disabled={loading}
              className="btn-shine w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:scale-[1.02] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Memproses... ⏳"
              ) : mode === "login" ? (
                <><LogIn size={18} /> Masuk ke Akun</>
              ) : (
                <><UserPlus size={18} /> Daftar & Klaim 50 Poin</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center font-bold uppercase tracking-wider">
              Coba akun demo sekali klik
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin("demo@rmpadang.id", "demo123")}
                disabled={loading}
                className="glass-soft rounded-xl py-2.5 text-xs font-bold hover:bg-white/10 transition"
              >
                🍛 Pelanggan
              </button>
              <button
                onClick={() => quickLogin("kasir@rmpadang.id", "kasir123")}
                disabled={loading}
                className="glass-soft rounded-xl py-2.5 text-xs font-bold hover:bg-white/10 transition"
              >
                🧾 Kasir
              </button>
              <button
                onClick={() => quickLogin("admin@rmpadang.id", "admin123")}
                disabled={loading}
                className="glass-soft rounded-xl py-2.5 text-xs font-bold hover:bg-white/10 transition"
              >
                👨‍🍳 Admin
              </button>
            </div>
          </div>

          {mode === "register" && (
            <p className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              Dengan mendaftar, Anda menyetujui S&K dan kebijakan privasi.
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
