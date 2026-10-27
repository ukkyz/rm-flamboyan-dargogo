"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Trash2,
  Bike,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  PackageCheck,
} from "lucide-react";
import { rupiah } from "@/lib/utils";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  emoji: string;
  isAvailable: boolean;
  isSpicy: number;
  stock: number;
};

type CartLine = { menuId: number; qty: number };
type Me = { id: number; name: string; points: number; level: string } | null;

const TYPE_INFO = [
  { id: "dine_in", label: "Makan di Tempat", icon: UtensilsCrossed, emoji: "🍽️" },
  { id: "takeaway", label: "Bawa Pulang", icon: ShoppingBag, emoji: "🥡" },
  { id: "delivery", label: "Diantar", icon: Bike, emoji: "🛵" },
];

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState("dine_in");
  const [table, setTable] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [payment, setPayment] = useState("tunai");
  const [usePoints, setUsePoints] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<{ code: string; total: number; earned: number } | null>(null);
  const [myOrders, setMyOrders] = useState<{ code: string; status: string; total: number }[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        let r = await fetch("/api/menu", { cache: "no-store" });
        let j = await r.json();
        if (!j.items || j.items.length === 0) {
          await fetch("/api/seed", { method: "POST" });
          r = await fetch("/api/menu", { cache: "no-store" });
          j = await r.json();
        }
        setMenu(j.items || []);
      } catch {
        setMenu([]);
      }
      setLoading(false);
      try {
        const m = await fetch("/api/auth/me", { cache: "no-store" });
        const mj = await m.json();
        setMe(mj.user);
      } catch { /* guest */ }
      try {
        const o = await fetch("/api/orders?mine=1", { cache: "no-store" });
        const oj = await o.json();
        if (oj.orders) setMyOrders(oj.orders.slice(0, 5));
      } catch { /* ignore */ }
    };
    init();
  }, []);

  const cats = useMemo(() => ["Semua", ...Array.from(new Set(menu.map((m) => m.category)))], [menu]);
  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          (cat === "Semua" || m.category === cat) &&
          (q === "" || m.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [menu, cat, q]
  );

  const cartDetailed = useMemo(
    () =>
      cart
        .map((c) => ({ ...c, item: menu.find((m) => m.id === c.menuId)! }))
        .filter((c) => c.item),
    [cart, menu]
  );
  const subtotal = cartDetailed.reduce((s, c) => s + c.item.price * c.qty, 0);
  const maxUse = me ? Math.min(me.points, Math.floor(subtotal * 0.3 / 100)) : 0;
  const discount = Math.min(usePoints, maxUse) * 100;
  const total = Math.max(0, subtotal - discount);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const earned = Math.floor(total / 10000);

  const add = (id: number) => {
    setCart((p) => {
      const f = p.find((c) => c.menuId === id);
      if (f) return p.map((c) => (c.menuId === id ? { ...c, qty: Math.min(20, c.qty + 1) } : c));
      return [...p, { menuId: id, qty: 1 }];
    });
  };
  const dec = (id: number) => {
    setCart((p) =>
      p.map((c) => (c.menuId === id ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!me && !guestName) {
      alert("Isi nama Anda dulu ya!");
      return;
    }
    setPlacing(true);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          type: orderType,
          tableNumber: table,
          address,
          notes,
          customerName: me?.name || guestName,
          customerPhone: guestPhone,
          paymentMethod: payment,
          usePoints: Math.min(usePoints, maxUse),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        alert(j.error || "Gagal memesan");
        setPlacing(false);
        return;
      }
      setSuccess({ code: j.order.code, total: j.order.total, earned: j.order.pointsEarned });
      setCart([]);
      setUsePoints(0);
      setCheckoutOpen(false);
      setCartOpen(false);
      // refresh me & orders
      const m = await fetch("/api/auth/me", { cache: "no-store" });
      setMe((await m.json()).user);
      const o = await fetch("/api/orders?mine=1", { cache: "no-store" });
      const oj = await o.json();
      if (oj.orders) setMyOrders(oj.orders.slice(0, 5));
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      alert("Koneksi bermasalah");
    }
    setPlacing(false);
  };

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    cooking: "👨‍🍳",
    ready: "🔔",
    completed: "✅",
    cancelled: "❌",
  };
  const statusLabel: Record<string, string> = {
    pending: "Menunggu",
    cooking: "Dimasak",
    ready: "Siap!",
    completed: "Selesai",
    cancelled: "Batal",
  };

  return (
    <main className="min-h-screen pt-24 pb-32 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">✦ Etalase Digital ✦</p>
            <h1 className="mt-2 text-3xl sm:text-5xl font-black">
              Pilih{" "}
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                Hidanganmu
              </span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              {me ? (
                <>Halo <b className="text-white">{me.name}</b>! Kamu punya <b className="text-amber-300">{me.points} poin</b> 🎁</>
              ) : (
                <><a href="/auth" className="text-amber-300 font-bold underline">Masuk/Daftar</a> untuk kumpulkan poin tiap pembelian!</>
              )}
            </p>
          </div>
          {myOrders.length > 0 && (
            <div className="glass rounded-2xl px-4 py-3 text-sm max-w-xs w-full">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Pesanan Terakhir</p>
              <div className="space-y-1.5">
                {myOrders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono truncate">{o.code}</span>
                    <span className="shrink-0">{statusEmoji[o.status]} {statusLabel[o.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* search + categories */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 glass rounded-2xl px-4 flex-1">
            <Search size={18} className="text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari rendang, ayam pop, sate..."
              className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${
                cat === c
                  ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black"
                  : "glass text-slate-300 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass rounded-3xl p-5 animate-pulse">
                <div className="h-20 rounded-2xl bg-white/10" />
                <div className="mt-3 h-4 rounded bg-white/10" />
                <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((m, i) => {
              const inCart = cart.find((c) => c.menuId === m.id)?.qty || 0;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className={`glass rounded-3xl p-3 sm:p-5 relative overflow-hidden group hover:border-amber-400/40 transition ${
                    !m.isAvailable || m.stock <= 0 ? "opacity-60" : ""
                  }`}
                >
                  <div className="text-center text-5xl sm:text-7xl py-2 sm:py-4 rounded-2xl bg-gradient-to-b from-white/10 to-transparent group-hover:scale-105 transition-transform">
                    {m.emoji}
                  </div>
                  {m.isSpicy > 0 && (
                    <span className="absolute top-3 right-3 text-xs bg-black/50 rounded-full px-2 py-0.5">
                      {"🌶️".repeat(Math.min(3, m.isSpicy))}
                    </span>
                  )}
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold">
                    {m.category}
                  </span>
                  <p className="mt-1 font-black text-sm sm:text-lg leading-tight">{m.name}</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 mt-1 min-h-8">{m.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-black text-amber-300 text-sm sm:text-lg">{rupiah(m.price)}</p>
                    <p className="text-[10px] text-slate-500">stok {m.stock}</p>
                  </div>
                  {(!m.isAvailable || m.stock <= 0) ? (
                    <button disabled className="mt-3 w-full py-2.5 rounded-xl bg-white/5 text-slate-500 font-bold text-sm">
                      Habis
                    </button>
                  ) : inCart === 0 ? (
                    <button
                      onClick={() => add(m.id)}
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black text-sm hover:scale-[1.03] transition-transform flex items-center justify-center gap-1"
                    >
                      <Plus size={16} /> Tambah
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center justify-between bg-amber-400/15 rounded-xl p-1">
                      <button onClick={() => dec(m.id)} className="p-2 rounded-lg bg-black/40 hover:bg-black/60">
                        {inCart === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                      </button>
                      <span className="font-black text-lg">{inCart}</span>
                      <button onClick={() => add(m.id)} className="p-2 rounded-lg bg-gradient-to-r from-amber-400 to-rose-500 text-black">
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="mt-10 glass rounded-3xl p-12 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 font-bold">Menu tidak ditemukan</p>
            <p className="text-sm text-slate-400">Coba kata kunci lain</p>
          </div>
        )}
      </div>

      {/* floating cart */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && !checkoutOpen && !success && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-5 pr-2 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black shadow-[0_0_40px_rgba(251,146,60,0.6)] hover:scale-105 transition-transform"
          >
            <ShoppingCart size={20} />
            <span>{cartCount} item • {rupiah(subtotal)}</span>
            <span className="bg-black text-white text-sm px-4 py-2.5 rounded-xl">Lihat</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl">🛒 Keranjang</h3>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-xl glass-soft">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {cartDetailed.map((c) => (
                  <div key={c.menuId} className="glass-soft rounded-2xl p-3 flex items-center gap-3">
                    <span className="text-3xl">{c.item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{c.item.name}</p>
                      <p className="text-xs text-amber-300 font-bold">{rupiah(c.item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(c.menuId)} className="p-1.5 rounded-lg bg-black/40">
                        <Minus size={14} />
                      </button>
                      <span className="font-black w-6 text-center">{c.qty}</span>
                      <button onClick={() => add(c.menuId)} className="p-1.5 rounded-lg bg-amber-400 text-black">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 glass-soft rounded-2xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{rupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-amber-300 text-lg">{rupiah(subtotal)}</span>
                </div>
                <p className="text-xs text-slate-500">+{Math.floor(subtotal / 10000)} poin loyalty 🎁</p>
              </div>
              <button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                className="mt-4 w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black"
              >
                Lanjut ke Pembayaran →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* checkout modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
            onClick={() => setCheckoutOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl">💳 Checkout</h3>
                <button onClick={() => setCheckoutOpen(false)} className="p-2 rounded-xl glass-soft">
                  <X size={18} />
                </button>
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tipe Pesanan</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TYPE_INFO.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOrderType(t.id)}
                    className={`rounded-xl py-3 text-xs font-bold transition ${
                      orderType === t.id
                        ? "bg-gradient-to-br from-amber-400 to-rose-500 text-black"
                        : "glass-soft text-slate-300"
                    }`}
                  >
                    <span className="text-xl block">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {orderType === "dine_in" && (
                <input
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="Nomor meja (cth: A5) — opsional"
                  className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 focus:border-amber-400/50 border border-transparent"
                />
              )}
              {orderType === "delivery" && (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap pengiriman..."
                  rows={2}
                  className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 focus:border-amber-400/50 border border-transparent"
                />
              )}

              {!me && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nama Anda*"
                    className="glass-soft rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 border border-transparent"
                  />
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="No. HP"
                    className="glass-soft rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 border border-transparent"
                  />
                </div>
              )}

              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan: level pedas, tanpa MSG, dll."
                className="mt-3 w-full glass-soft rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 border border-transparent"
              />

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Pembayaran</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[
                  { id: "tunai", l: "💵 Tunai" },
                  { id: "qris", l: "📱 QRIS" },
                  { id: "transfer", l: "🏦 Transfer" },
                  { id: "ewallet", l: "👛 E-Wallet" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      payment === p.id ? "bg-amber-400 text-black" : "glass-soft"
                    }`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>

              {me && me.points > 0 && (
                <div className="mt-4 glass-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-300" /> Pakai Poin
                    </span>
                    <span className="text-xs text-slate-400">{me.points} tersedia • maks {maxUse}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxUse}
                    value={Math.min(usePoints, maxUse)}
                    onChange={(e) => setUsePoints(Number(e.target.value))}
                    className="w-full mt-3 accent-amber-400"
                  />
                  <div className="flex justify-between text-xs">
                    <span>{Math.min(usePoints, maxUse)} poin</span>
                    <span className="text-emerald-300 font-bold">-{rupiah(discount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">1 poin = Rp 100 • maks 30% total</p>
                </div>
              )}

              <div className="mt-4 glass-soft rounded-2xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({cartCount} item)</span>
                  <span>{rupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Diskon poin</span>
                    <span>-{rupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="font-bold">Total Bayar</span>
                  <span className="font-black text-amber-300 text-xl">{rupiah(total)}</span>
                </div>
                <p className="text-xs text-slate-500">Akan dapat +{earned} poin 🎁</p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || cart.length === 0}
                className="btn-shine mt-4 w-full py-4 rounded-xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black disabled:opacity-60"
              >
                {placing ? "Memesan... ⏳" : `Buat Pesanan • ${rupiah(total)}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* success modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-md rounded-3xl p-8 text-center"
            >
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="text-7xl"
              >
                🎉
              </motion.p>
              <h3 className="mt-4 text-2xl font-black">Pesanan Diterima!</h3>
              <p className="mt-2 text-sm text-slate-400">Tunjukkan kode ini ke kasir</p>
              <p className="mt-2 font-mono text-2xl font-black text-amber-300 bg-black/40 rounded-2xl py-3">
                {success.code}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="glass-soft rounded-xl p-3">
                  <p className="text-slate-500 text-xs">Total</p>
                  <p className="font-black">{rupiah(success.total)}</p>
                </div>
                <div className="glass-soft rounded-xl p-3">
                  <p className="text-slate-500 text-xs">Poin Didapat</p>
                  <p className="font-black text-amber-300">+{success.earned} 🎁</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Clock size={14} /> Estimasi 15–25 menit
                <span>•</span>
                <ChefHat size={14} /> Dapur menyiapkan
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSuccess(null)}
                  className="py-3 rounded-xl font-bold glass hover:bg-white/15"
                >
                  Pesan Lagi
                </button>
                <a
                  href="/dashboard"
                  className="py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-center"
                >
                  Lacak Pesanan
                </a>
              </div>
              {!me && (
                <a href="/auth" className="mt-3 block text-xs text-amber-300 underline">
                  Daftar untuk klaim {success.earned} poin pesanan ini!
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
