"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, Ticket, Gamepad2, ChevronRight } from "lucide-react";
import { rupiah, shortDate } from "@/lib/utils";

type Order = {
  id: number;
  code: string;
  status: string;
  total: number;
  type: string;
  createdAt: string;
  pointsEarned: number;
  items: { menuName: string; menuEmoji: string; qty: number; price: number }[];
};

const STATUS: Record<string, { e: string; l: string; c: string }> = {
  pending: { e: "⏳", l: "Menunggu", c: "bg-amber-500/20 text-amber-300" },
  cooking: { e: "👨‍🍳", l: "Dimasak", c: "bg-orange-500/20 text-orange-300" },
  ready: { e: "🔔", l: "Siap Diambil", c: "bg-emerald-500/20 text-emerald-300" },
  completed: { e: "✅", l: "Selesai", c: "bg-cyan-500/20 text-cyan-300" },
  cancelled: { e: "❌", l: "Dibatalkan", c: "bg-rose-500/20 text-rose-300" },
};

const STEPS = ["pending", "cooking", "ready", "completed"];

export default function DashboardPage() {
  const [me, setMe] = useState<{ name: string; points: number; level: string; avatar: string; totalSpent: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const m = await fetch("/api/auth/me", { cache: "no-store" });
        const mj = await m.json();
        setMe(mj.user);
        if (mj.user?.role === "admin" || mj.user?.role === "kasir") {
          window.location.href = "/admin";
          return;
        }
        const o = await fetch("/api/orders?mine=1", { cache: "no-store" });
        const oj = await o.json();
        setOrders(oj.orders || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen pt-28 px-6 text-center text-slate-400">
        <p className="text-5xl animate-bounce-soft">🍛</p>
        <p className="mt-3">Memuat akunmu...</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-10 text-center max-w-md">
          <p className="text-6xl">🔒</p>
          <h1 className="mt-4 text-2xl font-black">Belum Masuk</h1>
          <p className="mt-2 text-slate-400 text-sm">Masuk dulu untuk melihat pesanan & poinmu.</p>
          <Link href="/auth" className="mt-5 inline-block px-8 py-3 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
            Masuk / Daftar
          </Link>
        </div>
      </main>
    );
  }

  const active = orders.filter((o) => ["pending", "cooking", "ready"].includes(o.status));
  const past = orders.filter((o) => !["pending", "cooking", "ready"].includes(o.status));

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{me.avatar}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Halo, {me.name}! 👋</h1>
              <p className="text-sm text-slate-400">
                Level <b className="text-amber-300">{me.level}</b> •{" "}
                <b className="text-amber-300">{me.points} poin</b> 🎁
              </p>
            </div>
          </div>
          <Link href="/menu" className="btn-shine px-6 py-3 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">
            + Pesan Lagi
          </Link>
        </div>

        <div className="mt-6 grid sm:grid-cols-4 gap-3">
          {[
            { icon: <Sparkles size={20} />, l: "Poin Saya", v: `${me.points}`, href: "/loyalty", c: "text-amber-300" },
            { icon: <ShoppingBag size={20} />, l: "Total Pesanan", v: `${orders.length}`, href: "/menu", c: "text-cyan-300" },
            { icon: <Ticket size={20} />, l: "Belanja", v: rupiah(me.totalSpent || 0), href: "/loyalty", c: "text-emerald-300" },
            { icon: <Gamepad2 size={20} />, l: "Game Anak", v: "Main!", href: "/game", c: "text-violet-300" },
          ].map((s, i) => (
            <Link key={i} href={s.href} className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-white/30 transition group">
              <span className={`${s.c}`}>{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-500 font-bold uppercase">{s.l}</p>
                <p className="font-black truncate text-sm">{s.v}</p>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {active.length > 0 && (
          <div className="mt-8">
            <h2 className="font-black text-xl flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
              </span>
              Sedang Berlangsung ({active.length})
            </h2>
            <div className="mt-4 grid lg:grid-cols-2 gap-4">
              {active.map((o) => {
                const stepIdx = STEPS.indexOf(o.status);
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-strong rounded-3xl p-5 border-amber-400/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-black text-amber-300">{o.code}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${STATUS[o.status]?.c}`}>
                        {STATUS[o.status]?.e} {STATUS[o.status]?.l}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center">
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex-1 flex items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                              i <= stepIdx ? "bg-gradient-to-br from-amber-400 to-rose-500" : "bg-white/10 opacity-40"
                            }`}>
                              {["📝", "👨‍🍳", "🔔", "✅"][i]}
                            </span>
                            <span className="text-[10px] mt-1 text-slate-400">
                              {["Diterima", "Dimasak", "Siap", "Selesai"][i]}
                            </span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-1 rounded mx-1 mb-5 ${i < stepIdx ? "bg-amber-400" : "bg-white/10"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 glass-soft rounded-xl p-3 text-sm">
                      {o.items.map((it, j) => (
                        <div key={j} className="flex justify-between py-0.5">
                          <span>{it.menuEmoji} {it.qty}x {it.menuName}</span>
                          <span className="text-slate-400">{rupiah(it.price * it.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-1 border-t border-white/10 font-black">
                        <span>Total</span>
                        <span className="text-amber-300">{rupiah(o.total)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">{shortDate(o.createdAt)} • +{o.pointsEarned} poin 🎁</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-black text-xl">📜 Riwayat Pesanan</h2>
          {orders.length === 0 ? (
            <div className="mt-4 glass rounded-3xl p-10 text-center">
              <p className="text-5xl">🍽️</p>
              <p className="mt-3 font-bold">Belum ada pesanan</p>
              <p className="text-sm text-slate-400">Yuk pesan rendang pertamamu!</p>
              <Link href="/menu" className="mt-4 inline-block px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">
                Lihat Menu
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {(past.length > 0 ? past : orders).map((o) => (
                <div key={o.id} className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-mono font-bold text-sm">{o.code}</p>
                    <p className="text-[11px] text-slate-500">
                      {shortDate(o.createdAt)} • {o.items.map((i) => `${i.qty}x ${i.menuName}`).join(", ").slice(0, 60)}
                    </p>
                  </div>
                  <span className="font-black text-amber-300 text-sm">{rupiah(o.total)}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${STATUS[o.status]?.c}`}>
                    {STATUS[o.status]?.e} {STATUS[o.status]?.l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
