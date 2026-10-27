"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { rupiah, shortDate } from "@/lib/utils";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from "lucide-react";

type Txn = {
  id: number;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdBy: string | null;
};

const COLORS = ["#fbbf24", "#fb7185", "#34d399", "#60a5fa", "#a78bfa", "#f97316", "#22d3ee"];

const EXP_CATS = ["Belanja Bahan", "Gaji", "Operasional", "Sewa", "Marketing", "Peralatan", "Lainnya"];
const INC_CATS = ["Penjualan", "Catering", "Lainnya"];

export default function KeuanganPage() {
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [data, setData] = useState<{
    txns: Txn[];
    summary: { income: number; expense: number; profit: number; margin: number };
    daily: { label: string; income: number; expense: number }[];
    byCat: { category: string; total: number }[];
    orderStats: { status: string; count: number; total: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "Belanja Bahan", amount: "", description: "" });
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const m = await fetch("/api/auth/me", { cache: "no-store" });
      const mj = await m.json();
      setMe(mj.user);
      if (!mj.user || (mj.user.role !== "admin" && mj.user.role !== "kasir")) {
        setLoading(false);
        return;
      }
      const r = await fetch("/api/finance?days=30", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }
    const r = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    if (!r.ok) {
      alert("Gagal menyimpan");
      return;
    }
    setShowForm(false);
    setForm({ type: "expense", category: "Belanja Bahan", amount: "", description: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/finance?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-28 text-center text-slate-400">
        <p className="text-5xl animate-bounce-soft">💰</p>
        <p className="mt-3">Menghitung keuangan...</p>
      </main>
    );
  }

  if (!me || (me.role !== "admin" && me.role !== "kasir")) {
    return (
      <main className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-10 text-center max-w-md">
          <p className="text-6xl">🔐</p>
          <h1 className="mt-4 text-2xl font-black">Khusus Admin & Kasir</h1>
          <p className="mt-2 text-sm text-slate-400">Masuk sebagai admin untuk mengelola keuangan.</p>
          <Link href="/auth" className="mt-5 inline-block px-8 py-3 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
            Masuk
          </Link>
          <p className="mt-4 text-[11px] text-slate-500">Demo: admin@rmpadang.id / admin123</p>
        </div>
      </main>
    );
  }

  const txns = (data?.txns || []).filter((t) => filter === "all" || t.type === filter);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-emerald-300 uppercase">✦ Pengelolaan Keuangan ✦</p>
            <h1 className="text-3xl font-black">Dasbor Keuangan 💰</h1>
            <p className="text-sm text-slate-400">30 hari terakhir • otomatis tercatat dari pesanan</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-shine flex items-center gap-2 px-5 py-3 rounded-xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-black text-sm"
          >
            <Plus size={18} /> Catat Transaksi
          </button>
        </div>

        {/* summary */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Pemasukan", v: rupiah(data?.summary.income || 0), e: "📈", icon: <TrendingUp size={18} />, c: "text-emerald-300" },
            { l: "Pengeluaran", v: rupiah(data?.summary.expense || 0), e: "📉", icon: <TrendingDown size={18} />, c: "text-rose-300" },
            { l: "Laba Bersih", v: rupiah(data?.summary.profit || 0), e: "💰", icon: <Wallet size={18} />, c: "text-amber-300" },
            { l: "Margin", v: `${data?.summary.margin || 0}%`, e: "📊", icon: <PieIcon size={18} />, c: "text-cyan-300" },
          ].map((s, i) => (
            <div key={i} className="glass rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-2xl">{s.e}</p>
                <span className={s.c}>{s.icon}</span>
              </div>
              <p className="mt-2 font-black text-base sm:text-xl truncate">{s.v}</p>
              <p className="text-[11px] text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        {/* charts */}
        <div className="mt-4 grid lg:grid-cols-5 gap-4">
          <div className="glass rounded-3xl p-5 lg:col-span-3">
            <p className="font-black">📊 Arus Kas 14 Hari</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#0f0a1e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
                    formatter={((v: unknown) => [rupiah(Number(v) || 0), ""]) as never}
                  />
                  <Bar dataKey="income" name="Masuk" fill="#34d399" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Keluar" fill="#fb7185" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass rounded-3xl p-5 lg:col-span-2">
            <p className="font-black">🥧 Pengeluaran per Kategori</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.byCat || []}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    labelLine={false}
                  >
                    {(data?.byCat || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f0a1e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
                    formatter={((v: unknown) => [rupiah(Number(v) || 0), ""]) as never}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* order stats */}
        <div className="mt-4 glass rounded-3xl p-5">
          <p className="font-black">📦 Statistik Pesanan</p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(data?.orderStats || []).map((s, i) => (
              <div key={i} className="glass-soft rounded-2xl p-3 text-center">
                <p className="font-black text-lg">{s.count}</p>
                <p className="text-[11px] text-slate-400 capitalize">{s.status}</p>
                <p className="text-[11px] text-amber-300 font-bold">{rupiah(s.total)}</p>
              </div>
            ))}
            {(data?.orderStats || []).length === 0 && (
              <p className="text-slate-500 text-sm col-span-full text-center py-4">Belum ada data pesanan</p>
            )}
          </div>
        </div>

        {/* txns */}
        <div className="mt-4 glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-black">🧾 Riwayat Transaksi</p>
            <div className="flex gap-2">
              {["all", "income", "expense"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold ${filter === f ? "bg-amber-400 text-black" : "glass-soft"}`}
                >
                  {f === "all" ? "Semua" : f === "income" ? "Masuk" : "Keluar"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {txns.map((t) => (
              <div key={t.id} className="glass-soft rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.type === "income" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                  {t.type === "income" ? "💵" : "💸"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{t.category} — {t.description || "-"}</p>
                  <p className="text-[11px] text-slate-500">{shortDate(t.date)} • {t.createdBy || "sistem"}</p>
                </div>
                <span className={`font-black text-sm ${t.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                  {t.type === "income" ? "+" : "-"}{rupiah(t.amount)}
                </span>
                {me.role === "admin" && (
                  <button onClick={() => del(t.id)} className="p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {txns.length === 0 && <p className="text-center text-slate-500 py-8">Belum ada transaksi</p>}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong w-full max-w-md rounded-3xl p-6">
            <h3 className="font-black text-lg">➕ Catat Transaksi</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, category: t === "income" ? "Penjualan" : "Belanja Bahan" })}
                  className={`py-2.5 rounded-xl font-bold text-sm ${form.type === t ? (t === "income" ? "bg-emerald-400 text-black" : "bg-rose-400 text-black") : "glass-soft"}`}
                >
                  {t === "income" ? "💵 Pemasukan" : "💸 Pengeluaran"}
                </button>
              ))}
            </div>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none text-sm bg-transparent"
            >
              {(form.type === "income" ? INC_CATS : EXP_CATS).map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Nominal (Rp)"
              className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none text-sm"
            />
            {form.amount && (
              <p className="mt-1 text-xs text-amber-300 font-bold">= {rupiah(Number(form.amount))}</p>
            )}
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Keterangan..."
              rows={2}
              className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none text-sm"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setShowForm(false)} className="py-3 rounded-xl font-bold glass text-sm">Batal</button>
              <button onClick={save} className="py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-black text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
