"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Gift, History, Ticket, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { LEVEL_COLORS, LEVEL_NEED } from "@/lib/utils";

type Reward = {
  id: number;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number;
  emoji: string;
  isActive: boolean;
  redeemedCount: number;
};

type LoyaltyData = {
  me: { id: number; name: string; points: number; level: string; totalSpent: number; avatar: string };
  history: { id: number; type: string; amount: number; description: string | null; createdAt: string }[];
  redemptions: { id: number; code: string; rewardName: string; pointsSpent: number; status: string; createdAt: string }[];
  leaderboard: { name: string; points: number; level: string; avatar: string }[];
};

const LEVELS = ["Perunggu", "Perak", "Emas", "Platinum", "Berlian"];
const MISSIONS = [
  { e: "🍛", t: "Pesan 3x seminggu", d: "+30 poin bonus", p: 66 },
  { e: "🎮", t: "Main game anak", d: "+20 poin/hari", p: 40 },
  { e: "⭐", t: "Coba 5 menu berbeda", d: "Lencana Penjelajah", p: 80 },
  { e: "👥", t: "Ajak 1 teman daftar", d: "+50 poin tiap teman", p: 25 },
];

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [voucher, setVoucher] = useState<{ code: string; name: string } | null>(null);
  const [tab, setTab] = useState<"rewards" | "history" | "vouchers" | "leaders">("rewards");

  const load = async () => {
    try {
      const r = await fetch("/api/rewards", { cache: "no-store" });
      const j = await r.json();
      let rw = j.rewards || [];
      if (rw.length === 0) {
        await fetch("/api/seed", { method: "POST" });
        const r2 = await fetch("/api/rewards", { cache: "no-store" });
        rw = (await r2.json()).rewards || [];
      }
      setRewards(rw);
    } catch { /* ignore */ }
    try {
      const l = await fetch("/api/loyalty", { cache: "no-store" });
      if (l.ok) setData(await l.json());
    } catch { /* guest */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const redeem = async (id: number) => {
    if (!data) {
      alert("Masuk dulu untuk menukar poin!");
      return;
    }
    if (!confirm("Tukar poin dengan hadiah ini?")) return;
    setRedeeming(id);
    try {
      const r = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: id }),
      });
      const j = await r.json();
      if (!r.ok) {
        alert(j.error || "Gagal menukar");
        setRedeeming(null);
        return;
      }
      setVoucher({ code: j.redemption.code, name: j.redemption.rewardName });
      const l = await fetch("/api/loyalty", { cache: "no-store" });
      if (l.ok) setData(await l.json());
      const rw = await fetch("/api/rewards", { cache: "no-store" });
      setRewards((await rw.json()).rewards || []);
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      alert("Koneksi bermasalah");
    }
    setRedeeming(null);
  };

  const progress = data
    ? Math.min(100, Math.round(((data.me.totalSpent || 0) / (LEVEL_NEED[data.me.level] || 150000)) * 100))
    : 0;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">✦ Gamifikasi & Loyalty ✦</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-black">
          Makan Enak,{" "}
          <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
            Panen Hadiah
          </span>
        </h1>

        {!data && !loading && (
          <div className="mt-6 glass-strong rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-black text-lg">🔓 Buka kunci loyalty & misi seru!</p>
              <p className="text-sm text-slate-400">Daftar gratis, langsung dapat 50 poin + akses tukar hadiah.</p>
            </div>
            <Link
              href="/auth"
              className="px-6 py-3 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black"
            >
              Masuk / Daftar
            </Link>
          </div>
        )}

        {data && (
          <div className="mt-6 grid lg:grid-cols-3 gap-4">
            {/* kartu member */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br ${LEVEL_COLORS[data.me.level] || LEVEL_COLORS.Perunggu} text-black shadow-2xl`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/25 blur-2xl" />
              <div className="absolute bottom-0 right-0 text-[120px] opacity-20 leading-none">{data.me.avatar}</div>
              <div className="flex items-center justify-between">
                <p className="font-black tracking-widest text-xs opacity-70">MEMBER CARD</p>
                <Crown size={22} />
              </div>
              <p className="mt-4 font-black text-2xl truncate">{data.me.name}</p>
              <p className="text-sm font-bold opacity-70">Level {data.me.level}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold opacity-70">TOTAL POIN</p>
                  <p className="text-4xl font-black flex items-center gap-2">
                    <Sparkles size={28} /> {data.me.points}
                  </p>
                </div>
                <div className="text-right text-xs font-bold opacity-70">
                  <p>Belanja</p>
                  <p>Rp {(data.me.totalSpent || 0).toLocaleString("id-ID")}</p>
                </div>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-black/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-black/70 rounded-full"
                />
              </div>
              <p className="mt-1.5 text-[11px] font-bold opacity-70">
                {progress}% menuju level berikutnya
              </p>
            </motion.div>

            {/* misi */}
            <div className="glass rounded-3xl p-6">
              <p className="font-black flex items-center gap-2">
                <Trophy size={18} className="text-amber-300" /> Misi Mingguan
              </p>
              <div className="mt-4 space-y-3">
                {MISSIONS.map((m, i) => (
                  <div key={i} className="glass-soft rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.e}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{m.t}</p>
                        <p className="text-[11px] text-amber-300">{m.d}</p>
                      </div>
                      <span className="text-xs font-black text-slate-400">{m.p}%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${m.p}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* level path */}
            <div className="glass rounded-3xl p-6">
              <p className="font-black">🛤️ Jalur Level</p>
              <div className="mt-4 space-y-1">
                {LEVELS.map((l, i) => {
                  const idx = LEVELS.indexOf(data.me.level);
                  const done = i <= idx;
                  const cur = i === idx;
                  return (
                    <div key={l} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${cur ? "bg-amber-400/15 border border-amber-400/40" : ""}`}>
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${LEVEL_COLORS[l]} flex items-center justify-center text-sm font-black text-black`}>
                        {done ? "✓" : i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{l} {cur && "← kamu"}</p>
                        <p className="text-[11px] text-slate-500">
                          {l === "Perunggu" ? "Mulai" : `Belanja Rp ${LEVEL_NEED[LEVELS[i - 1]]?.toLocaleString("id-ID")}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "rewards", l: "🎁 Tukar Hadiah", icon: Gift },
            { id: "vouchers", l: "🎫 Voucherku", icon: Ticket },
            { id: "history", l: "📜 Riwayat Poin", icon: History },
            { id: "leaders", l: "🏆 Papan Peringkat", icon: Crown },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t.id
                  ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black"
                  : "glass text-slate-300"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 glass rounded-3xl p-12 text-center text-slate-400">Memuat... ⏳</div>
        ) : (
          <>
            {tab === "rewards" && (
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {rewards.map((r, i) => {
                  const afford = data ? data.me.points >= r.pointsCost : false;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-3xl p-4 sm:p-5 text-center hover:border-amber-400/40 transition"
                    >
                      <p className="text-5xl sm:text-6xl">{r.emoji}</p>
                      <p className="mt-3 font-black text-sm sm:text-base">{r.name}</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1 min-h-8">{r.description}</p>
                      <p className="mt-2 font-black text-amber-300 flex items-center justify-center gap-1">
                        <Sparkles size={14} /> {r.pointsCost} poin
                      </p>
                      <p className="text-[10px] text-slate-500">stok {r.stock} • {r.redeemedCount}x ditukar</p>
                      <button
                        onClick={() => redeem(r.id)}
                        disabled={redeeming === r.id || r.stock <= 0}
                        className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition ${
                          afford
                            ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:scale-[1.03]"
                            : "glass-soft text-slate-400"
                        } disabled:opacity-60`}
                      >
                        {redeeming === r.id ? "Menukar..." : r.stock <= 0 ? "Habis" : data ? (afford ? "Tukar Sekarang" : "Poin Kurang") : "Masuk untuk Tukar"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {tab === "vouchers" && (
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {!data ? (
                  <div className="glass rounded-3xl p-8 text-center col-span-full">
                    <p className="text-4xl">🔒</p>
                    <p className="mt-2 font-bold">Masuk untuk melihat vouchermu</p>
                    <Link href="/auth" className="mt-3 inline-block px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">
                      Masuk / Daftar
                    </Link>
                  </div>
                ) : data.redemptions.length === 0 ? (
                  <div className="glass rounded-3xl p-8 text-center col-span-full">
                    <p className="text-4xl">🎫</p>
                    <p className="mt-2 font-bold">Belum ada voucher</p>
                    <p className="text-sm text-slate-400">Tukar poinmu dengan hadiah menarik!</p>
                  </div>
                ) : (
                  data.redemptions.map((v) => (
                    <div
                      key={v.id}
                      className={`rounded-3xl p-5 border-2 border-dashed ${
                        v.status === "used"
                          ? "glass opacity-50 border-white/20"
                          : "glass-strong border-amber-400/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-black">{v.rewardName}</p>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${v.status === "used" ? "bg-white/10" : "bg-emerald-500/20 text-emerald-300"}`}>
                          {v.status === "used" ? "Terpakai" : "Aktif"}
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-xl font-black text-amber-300 bg-black/40 rounded-xl py-2.5 text-center tracking-widest">
                        {v.code}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        -{v.pointsSpent} poin • {new Date(v.createdAt).toLocaleDateString("id-ID")}
                      </p>
                      {v.status !== "used" && (
                        <p className="mt-1 text-[11px] text-slate-400">Tunjukkan kode ini ke kasir 🧾</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "history" && (
              <div className="mt-6 glass rounded-3xl p-4 sm:p-6">
                {!data ? (
                  <p className="text-center text-slate-400 py-8">Masuk untuk melihat riwayat poin 🔒</p>
                ) : data.history.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Belum ada riwayat poin</p>
                ) : (
                  <div className="space-y-2">
                    {data.history.map((h) => (
                      <div key={h.id} className="glass-soft rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          h.amount >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}>
                          {h.type === "bonus_game" ? "🎮" : h.amount >= 0 ? "➕" : "➖"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{h.description || h.type}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(h.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span className={`font-black ${h.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {h.amount >= 0 ? "+" : ""}{h.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "leaders" && (
              <div className="mt-6 grid lg:grid-cols-2 gap-4">
                <div className="glass rounded-3xl p-6">
                  <p className="font-black">🏆 Top Kolektor Poin</p>
                  <div className="mt-4 space-y-2">
                    {(data?.leaderboard || []).map((l, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                          i === 0 ? "bg-gradient-to-r from-amber-400/25 to-rose-500/25 border border-amber-400/40" : "glass-soft"
                        }`}
                      >
                        <span className="font-black w-8 text-center">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <span className="text-2xl">{l.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{l.name}</p>
                          <p className="text-[11px] text-slate-500">{l.level}</p>
                        </div>
                        <span className="font-black text-amber-300 text-sm">{l.points} pts</span>
                      </div>
                    ))}
                    {(!data || data.leaderboard.length === 0) && (
                      <p className="text-slate-500 text-sm text-center py-6">Belum ada data — jadilah yang pertama! 🚀</p>
                    )}
                  </div>
                </div>
                <div className="glass-strong rounded-3xl p-6">
                  <p className="font-black">❓ Cara Dapat Poin</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ["🛒", "Belanja", "Tiap Rp 10.000 = 1 poin otomatis"],
                      ["🎁", "Pendaftaran", "Bonus 50 poin untuk member baru"],
                      ["🎮", "Game Anak", "Menangkan hingga 20 poin per permainan"],
                      ["👥", "Ajak Teman", "50 poin tiap teman yang mendaftar"],
                      ["🎂", "Ulang Tahun", "Bonus 100 poin di bulan lahirmu"],
                      ["⭐", "Level Up", "Bonus poin tiap naik level"],
                    ].map(([e, t, d], i) => (
                      <div key={i} className="flex items-center gap-3 glass-soft rounded-xl px-4 py-2.5">
                        <span className="text-xl">{e}</span>
                        <div>
                          <p className="font-bold">{t}</p>
                          <p className="text-xs text-slate-400">{d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/menu" className="mt-4 flex items-center justify-center gap-1 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">
                    Mulai Kumpulkan Poin <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {voucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-strong w-full max-w-md rounded-3xl p-8 text-center"
          >
            <p className="text-7xl">🎉</p>
            <h3 className="mt-4 text-2xl font-black">Penukaran Berhasil!</h3>
            <p className="text-slate-400 text-sm">{voucher.name}</p>
            <p className="mt-4 font-mono text-2xl font-black text-amber-300 bg-black/40 rounded-2xl py-3 tracking-widest">
              {voucher.code}
            </p>
            <p className="mt-2 text-xs text-slate-500">Screenshot & tunjukkan ke kasir 🧾</p>
            <button
              onClick={() => { setVoucher(null); setTab("vouchers"); }}
              className="mt-5 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black"
            >
              Lihat Voucherku
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
