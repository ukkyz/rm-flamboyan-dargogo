"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah, shortDate } from "@/lib/utils";
import { BellRing, ChefHat, CheckCircle2, XCircle, Plus, Pencil, Trash2, Ticket, Wallet } from "lucide-react";

type Order = {
  id: number;
  code: string;
  status: string;
  total: number;
  customerName: string | null;
  type: string;
  tableNumber: string | null;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  items: { menuName: string; menuEmoji: string; qty: number }[];
};

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  stock: number;
  isAvailable: boolean;
  isSpicy: number;
  description: string | null;
  soldCount: number;
};

export default function AdminPage() {
  const [me, setMe] = useState<{ role: string; name: string } | null>(null);
  const [tab, setTab] = useState<"orders" | "menu" | "voucher">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<MenuItem> | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMsg, setVoucherMsg] = useState("");

  const load = async () => {
    try {
      const m = await fetch("/api/auth/me", { cache: "no-store" });
      const mj = await m.json();
      setMe(mj.user);
      if (!mj.user || (mj.user.role !== "admin" && mj.user.role !== "kasir")) {
        setLoading(false);
        return;
      }
      const [o, mn] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/menu", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setOrders(o.orders || []);
      setMenu(mn.items || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const setStatus = async (id: number, status: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const saveMenu = async () => {
    if (!editing?.name || !editing?.price) {
      alert("Nama & harga wajib diisi");
      return;
    }
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch("/api/menu", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!r.ok) {
      alert("Gagal menyimpan");
      return;
    }
    setEditing(null);
    load();
  };

  const delMenu = async (id: number) => {
    if (!confirm("Hapus menu ini?")) return;
    await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
    load();
  };

  const useVoucher = async () => {
    setVoucherMsg("");
    const r = await fetch("/api/rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useCode: voucherCode.trim().toUpperCase() }),
    });
    const j = await r.json();
    setVoucherMsg(r.ok ? `✅ ${j.redemption.rewardName} — berhasil dipakai!` : `❌ ${j.error}`);
    if (r.ok) setVoucherCode("");
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-28 text-center text-slate-400">
        <p className="text-5xl animate-bounce-soft">👨‍🍳</p>
        <p className="mt-3">Membuka dapur admin...</p>
      </main>
    );
  }

  if (!me || (me.role !== "admin" && me.role !== "kasir")) {
    return (
      <main className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-10 text-center max-w-md">
          <p className="text-6xl">🚫</p>
          <h1 className="mt-4 text-2xl font-black">Area Terbatas</h1>
          <p className="mt-2 text-sm text-slate-400">Halaman ini khusus Admin & Kasir.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href="/auth" className="py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">
              Masuk
            </Link>
            <Link href="/" className="py-3 rounded-xl font-bold glass text-sm">
              Beranda
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-slate-500">Demo: admin@rmpadang.id / admin123</p>
        </div>
      </main>
    );
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const todayOmzet = orders
    .filter((o) => o.status !== "cancelled" && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total, 0);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">
              ✦ Panel {me.role === "admin" ? "Admin" : "Kasir"} ✦
            </p>
            <h1 className="text-3xl font-black">Halo, {me.name}! 👨‍🍳</h1>
          </div>
          <Link href="/keuangan" className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold glass hover:bg-white/10 text-sm">
            <Wallet size={18} className="text-emerald-300" /> Keuangan
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Omzet Hari Ini", v: rupiah(todayOmzet), e: "💰" },
            { l: "Perlu Diproses", v: `${pendingCount} pesanan`, e: "🔔" },
            { l: "Total Pesanan", v: `${orders.length}`, e: "📦" },
            { l: "Menu Aktif", v: `${menu.filter((m) => m.isAvailable).length}/${menu.length}`, e: "🍛" },
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <p className="text-2xl">{s.e}</p>
              <p className="mt-1 font-black text-sm sm:text-lg truncate">{s.v}</p>
              <p className="text-[11px] text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {[
            { id: "orders", l: `📦 Pesanan ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
            { id: "menu", l: "🍛 Kelola Menu" },
            { id: "voucher", l: "🎫 Validasi Voucher" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t.id ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black" : "glass text-slate-300"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="mt-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {["all", "pending", "cooking", "ready", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold ${
                    filter === s ? "bg-amber-400 text-black" : "glass-soft text-slate-300"
                  }`}
                >
                  {s === "all" ? "Semua" : s}
                </button>
              ))}
            </div>
            <div className="mt-4 grid lg:grid-cols-2 gap-3">
              {filtered.length === 0 && (
                <div className="glass rounded-3xl p-10 text-center col-span-full text-slate-400">
                  Tidak ada pesanan 🎉
                </div>
              )}
              {filtered.map((o) => (
                <div key={o.id} className="glass rounded-3xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-black text-amber-300">{o.code}</p>
                      <p className="text-xs text-slate-400">
                        {o.customerName || "Tamu"} • {o.type === "dine_in" ? `🍽️ Meja ${o.tableNumber || "-"}` : o.type === "delivery" ? "🛵 Antar" : "🥡 Bungkus"} • {o.paymentMethod}
                      </p>
                      <p className="text-[11px] text-slate-500">{shortDate(o.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-bold ${
                      o.status === "pending" ? "bg-amber-500/20 text-amber-300 animate-pulse" :
                      o.status === "cooking" ? "bg-orange-500/20 text-orange-300" :
                      o.status === "ready" ? "bg-emerald-500/20 text-emerald-300" :
                      o.status === "completed" ? "bg-cyan-500/20 text-cyan-300" :
                      "bg-rose-500/20 text-rose-300"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-3 glass-soft rounded-xl p-3 text-sm space-y-0.5">
                    {o.items.map((it, j) => (
                      <p key={j}>{it.menuEmoji} {it.qty}x {it.menuName}</p>
                    ))}
                    {o.notes && <p className="text-xs text-slate-500 italic">📝 {o.notes}</p>}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-black">{rupiah(o.total)}</p>
                    <div className="flex gap-1.5">
                      {o.status === "pending" && (
                        <>
                          <button onClick={() => setStatus(o.id, "cooking")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/25 text-orange-200 text-xs font-bold hover:bg-orange-500/40">
                            <ChefHat size={14} /> Masak
                          </button>
                          <button onClick={() => setStatus(o.id, "cancelled")} className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {o.status === "cooking" && (
                        <button onClick={() => setStatus(o.id, "ready")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/25 text-emerald-200 text-xs font-bold hover:bg-emerald-500/40">
                          <BellRing size={14} /> Siap!
                        </button>
                      )}
                      {o.status === "ready" && (
                        <button onClick={() => setStatus(o.id, "completed")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/25 text-cyan-200 text-xs font-bold hover:bg-cyan-500/40">
                          <CheckCircle2 size={14} /> Selesai
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "menu" && (
          <div className="mt-5">
            <button
              onClick={() => setEditing({ name: "", price: 0, category: "Lauk", emoji: "🍛", stock: 100, isAvailable: true, isSpicy: 0, description: "" })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm"
            >
              <Plus size={16} /> Tambah Menu
            </button>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {menu.map((m) => (
                <div key={m.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-4xl">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    <p className="text-xs text-amber-300 font-bold">{rupiah(m.price)} • stok {m.stock}</p>
                    <p className="text-[11px] text-slate-500">
                      {m.category} • terjual {m.soldCount} • {m.isAvailable ? "✅ aktif" : "⏸️ nonaktif"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => setEditing({ ...m })} className="p-2 rounded-lg glass-soft hover:bg-white/15">
                      <Pencil size={14} />
                    </button>
                    {me.role === "admin" && (
                      <button onClick={() => delMenu(m.id)} className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {editing && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="glass-strong w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-black text-lg">{editing.id ? "✏️ Ubah Menu" : "➕ Menu Baru"}</h3>
                  <div className="mt-4 space-y-3">
                    <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nama menu" className="w-full glass-soft rounded-xl px-4 py-2.5 outline-none text-sm" />
                    <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Deskripsi" rows={2} className="w-full glass-soft rounded-xl px-4 py-2.5 outline-none text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="Harga" className="glass-soft rounded-xl px-4 py-2.5 outline-none text-sm" />
                      <input type="number" value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} placeholder="Stok" className="glass-soft rounded-xl px-4 py-2.5 outline-none text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={editing.category || "Lauk"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="glass-soft rounded-xl px-3 py-2.5 outline-none text-sm bg-transparent">
                        {["Lauk Utama", "Lauk", "Sayur", "Pelengkap", "Sambal", "Nasi", "Paket", "Minuman"].map((c) => (
                          <option key={c} value={c} className="bg-slate-900">{c}</option>
                        ))}
                      </select>
                      <input value={editing.emoji || ""} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} placeholder="🍛" className="glass-soft rounded-xl px-4 py-2.5 outline-none text-sm text-center" />
                      <select value={editing.isSpicy ?? 0} onChange={(e) => setEditing({ ...editing, isSpicy: Number(e.target.value) })} className="glass-soft rounded-xl px-3 py-2.5 outline-none text-sm bg-transparent">
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n} className="bg-slate-900">Pedas {n}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editing.isAvailable !== false} onChange={(e) => setEditing({ ...editing, isAvailable: e.target.checked })} className="accent-amber-400 w-4 h-4" />
                      Tersedia dijual
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setEditing(null)} className="py-2.5 rounded-xl font-bold glass text-sm">Batal</button>
                      <button onClick={saveMenu} className="py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm">Simpan</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "voucher" && (
          <div className="mt-5 max-w-lg">
            <div className="glass-strong rounded-3xl p-6">
              <p className="font-black text-lg flex items-center gap-2">
                <Ticket size={20} className="text-amber-300" /> Validasi Voucher Pelanggan
              </p>
              <p className="text-sm text-slate-400 mt-1">Masukkan kode voucher dari layar HP pelanggan.</p>
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="HADIAH-XXXXXX"
                className="mt-4 w-full glass-soft rounded-xl px-4 py-3.5 outline-none font-mono font-black text-lg tracking-widest text-center text-amber-300 placeholder:text-slate-600"
              />
              <button onClick={useVoucher} className="mt-3 w-full py-3 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
                Tandai Dipakai ✅
              </button>
              {voucherMsg && (
                <p className="mt-3 text-sm text-center font-bold glass-soft rounded-xl py-2.5">{voucherMsg}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
