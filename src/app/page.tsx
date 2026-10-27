"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  UtensilsCrossed,
  Sparkles,
  Gamepad2,
  Wallet,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Flame,
  ChefHat,
  Gift,
  Smartphone,
  Bike,
  ArrowRight,
} from "lucide-react";
import { rupiah } from "@/lib/utils";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  emoji: string;
  isSpicy: number;
};

const FALLING = ["🌶️", "🍗", "🥩", "🍚", "🥥", "🍢", "🥔", "🧄"];

function Steam({ left, delay }: { left: string; delay: string }) {
  return (
    <span
      className="absolute bottom-[38%] w-3 h-16 rounded-full bg-gradient-to-t from-white/0 via-white/40 to-white/0 blur-[3px]"
      style={{ left, animation: `steam 3.2s ease-in-out infinite`, animationDelay: delay }}
    />
  );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (e) => e[0].isIntersecting && setSeen(true),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return (
    <span ref={ref}>
      {n.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [seeding, setSeeding] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/menu", { cache: "no-store" });
        const j = await r.json();
        if (j.items && j.items.length > 0) {
          setMenu(j.items.slice(0, 8));
        } else {
          setSeeding(true);
          await fetch("/api/seed", { method: "POST" });
          const r2 = await fetch("/api/menu", { cache: "no-store" });
          const j2 = await r2.json();
          setMenu((j2.items || []).slice(0, 8));
          setSeeding(false);
        }
      } catch {
        setMenu([]);
      }
    };
    load();
  }, []);

  return (
    <main className="relative">
      {/* falling spices */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {FALLING.map((e, i) => (
          <span
            key={i}
            className="absolute text-xl opacity-30"
            style={{
              left: `${(i * 13 + 5) % 100}%`,
              top: "-60px",
              animation: `fall ${9 + i * 1.7}s linear infinite`,
              animationDelay: `${i * 1.3}s`,
              fontSize: `${16 + (i % 4) * 8}px`,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      {/* ============ HERO ============ */}
      <div ref={heroRef} className="relative min-h-[108vh] flex items-center overflow-hidden">
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
          <img
            src="../../public/images/rm-padang.jpg"
            alt="Rumah Makan Padang"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070510]/70 via-[#070510]/35 to-[#070510]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070510]/80 via-transparent to-[#070510]/60" />
        </motion.div>

        {/* animated lamp glow over etalase */}
        <div className="absolute left-[12%] top-[24%] w-40 h-40 rounded-full bg-amber-200/30 blur-[70px] animate-flicker" />
        <div className="absolute left-[16%] top-[30%] w-3 h-3 rounded-full bg-amber-100 shadow-[0_0_25px_10px_rgba(253,230,138,0.9)] animate-flicker" />

        {/* steam over etalase */}
        <div className="absolute left-[10%] top-[40%] w-[30%] h-40 pointer-events-none hidden md:block">
          <Steam left="20%" delay="0s" />
          <Steam left="45%" delay="0.8s" />
          <Steam left="65%" delay="1.5s" />
        </div>

        <motion.div
          style={{ opacity: fade }}
          className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16 w-full grid lg:grid-cols-2 gap-10 items-center"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-amber-300"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              Buka Hari Ini • 08.00 – 22.00 • Warung Asli, Rasa Juara
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] font-black leading-[1.02]"
            >
              <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-rose-400 bg-clip-text text-transparent neon-text">
                Rasa Padang
              </span>
              <br />
              <span className="text-white">Autentik,</span>{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Era Digital.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-5 text-slate-300 text-base sm:text-lg max-w-xl"
            >
              Dari etalase hangat warung kami ke layar HP Anda — pesan online, kumpulkan{" "}
              <span className="text-amber-300 font-bold">poin loyalty</span>, tukar hadiah, dan
              biarkan anak bermain <span className="text-cyan-300 font-bold">game masak</span>{" "}
              sambil menunggu!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <Link
                href="/menu"
                className="btn-shine group flex items-center gap-2 px-7 py-4 rounded-2xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black hover:scale-105 transition-transform shadow-[0_0_35px_rgba(251,146,60,0.55)]"
              >
                <UtensilsCrossed size={20} />
                Pesan Sekarang
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/game"
                className="glass flex items-center gap-2 px-7 py-4 rounded-2xl font-bold hover:bg-white/15 transition"
              >
                <Gamepad2 size={20} className="text-cyan-300" />
                Main Game Anak
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-8 grid grid-cols-3 max-w-md gap-3"
            >
              {[
                { v: 20, s: "+", l: "Menu Autentik" },
                { v: 15, s: "K+", l: "Porsi Terjual" },
                { v: 49, s: "", l: "Rating 4.9★" },
              ].map((s, i) => (
                <div key={i} className="glass rounded-2xl px-3 py-3 text-center">
                  <p className="text-xl sm:text-2xl font-black text-amber-300">
                    <CountUp to={s.v} suffix={s.s} />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* floating glass order card */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="glass-strong rounded-3xl p-6 max-w-md ml-auto relative overflow-hidden animate-floaty">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/25 blur-3xl" />
              <div className="flex items-center justify-between">
                <p className="font-black text-lg">🔥 Paling Laris</p>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Ready 5 mnt
                </span>
              </div>
              <img
                src="/images/rendang.jpg"
                alt="Rendang"
                className="mt-4 rounded-2xl w-full h-52 object-cover"
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-black text-xl">Rendang Sapi 🥩</p>
                  <p className="text-sm text-slate-400">Dimasak 8 jam • ⭐ 4.9 (2,1rb)</p>
                </div>
                <p className="font-black text-amber-300 text-xl">Rp 25rb</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/menu"
                  className="flex-1 text-center py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90"
                >
                  + Keranjang
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 text-center py-3 rounded-xl font-bold glass hover:bg-white/15"
                >
                  Lihat Menu
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Bike size={14} className="text-emerald-300" /> Antar 15–30 mnt
                <span className="mx-1">•</span>
                <Smartphone size={14} className="text-cyan-300" /> Lacak real-time
                <span className="mx-1">•</span>
                <Gift size={14} className="text-amber-300" /> +2 poin
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 text-xs animate-bounce-soft">
          <span>Gulir ke bawah</span>
          <span className="text-lg">⬇️</span>
        </div>
      </div>

      {/* ============ MARQUEE ============ */}
      <div className="relative border-y border-amber-400/20 bg-black/50 backdrop-blur-xl overflow-hidden py-3">
        <div className="flex whitespace-nowrap gap-8 w-max" style={{ animation: "marquee 22s linear infinite" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-8 text-sm font-bold text-amber-200/90">
              {["🥩 RENDANG JUARA DUNIA", "🍗 AYAM POP GURIH", "🌶️ SAMBAL IJO NAGIH", "🎁 TUKAR POIN = MAKAN GRATIS", "🎮 GAME ANAK BERHADIAH", "🛵 ANTAR CEPAT 30 MENIT"].map(
                (t, i) => (
                  <span key={i} className="flex items-center gap-8">
                    {t} <span className="text-rose-400">✦</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============ MENU PREVIEW ============ */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">
              ✦ Etalase Digital ✦
            </p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black">
              Hidangan <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">Unggulan</span>
            </h2>
          </div>
          <Link
            href="/menu"
            className="glass flex items-center gap-2 px-5 py-3 rounded-xl font-bold hover:bg-white/15 transition"
          >
            Lihat Semua Menu <ChevronRight size={18} />
          </Link>
        </div>

        {seeding ? (
          <div className="mt-10 glass rounded-3xl p-12 text-center text-slate-400">
            <p className="text-4xl animate-bounce-soft">🍳</p>
            <p className="mt-3">Menyiapkan dapur digital...</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {menu.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
                className="glass rounded-3xl p-4 sm:p-5 group hover:scale-[1.03] hover:border-amber-400/40 transition-all cursor-pointer"
              >
                <div className="relative text-center text-5xl sm:text-6xl py-3 rounded-2xl bg-gradient-to-b from-white/10 to-transparent group-hover:scale-110 transition-transform">
                  {m.emoji}
                  {m.isSpicy > 0 && (
                    <span className="absolute top-1 right-2 text-xs">
                      {"🌶️".repeat(Math.min(3, m.isSpicy))}
                    </span>
                  )}
                </div>
                <p className="mt-3 font-black text-sm sm:text-base truncate">{m.name}</p>
                <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 mt-1 h-8">
                  {m.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-black text-amber-300 text-sm sm:text-base">{rupiah(m.price)}</p>
                  <Link
                    href="/menu"
                    className="text-[11px] sm:text-xs px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold hover:bg-amber-400/35 transition"
                  >
                    + Pesan
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 glass-strong rounded-3xl overflow-hidden grid md:grid-cols-2"
        >
          <img src="/images/feast.jpg" alt="Hidangan Padang" className="w-full h-64 md:h-full object-cover" />
          <div className="p-8 sm:p-10">
            <p className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ChefHat size={18} /> Cerita Warung Kami
            </p>
            <h3 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">
              Dari Etalase Kuning yang Hangat, Kini Hadir Lebih Dekat.
            </h3>
            <p className="mt-4 text-slate-300 text-sm sm:text-base">
              Warung sederhana dengan atap genteng dan etalase kaca ini telah menyajikan rendang,
              gulai, dan sambal ijo selama bertahun-tahun. Kini kami hadirkan pengalaman futuristik:
              pesan dari rumah, pantau pesanan, kumpulkan poin — tanpa kehilangan kehangatan rasa.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="glass-soft rounded-xl p-3 flex items-center gap-2">
                <MapPin size={16} className="text-rose-400 shrink-0" /> Jl. Raya Nusantara No. 45
              </div>
              <div className="glass-soft rounded-xl p-3 flex items-center gap-2">
                <Clock size={16} className="text-emerald-300 shrink-0" /> 08.00 – 22.00 WIB
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FITUR ============ */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <p className="text-center text-sm font-bold tracking-[0.25em] text-cyan-300 uppercase">
          ✦ Ekosistem Digital ✦
        </p>
        <h2 className="mt-2 text-center text-3xl sm:text-5xl font-black">
          Satu Aplikasi, <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Semua Kebutuhan</span>
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <UtensilsCrossed size={28} />,
              color: "from-amber-400 to-orange-600",
              title: "Pesan Online",
              desc: "Pilih menu, atur meja / antar, bayar tunai / QRIS. Real-time!",
              href: "/menu",
              cta: "Mulai Pesan",
            },
            {
              icon: <Gift size={28} />,
              color: "from-rose-400 to-pink-600",
              title: "Loyalty & Poin",
              desc: "Rp 10rb = 1 poin. Naik level Perunggu → Berlian, tukar hadiah!",
              href: "/loyalty",
              cta: "Lihat Hadiah",
            },
            {
              icon: <Gamepad2 size={28} />,
              color: "from-cyan-400 to-blue-600",
              title: "Game Anak",
              desc: "Tangkap bahan, susun piring, kuis masak. Menang = poin!",
              href: "/game",
              cta: "Main Sekarang",
            },
            {
              icon: <Wallet size={28} />,
              color: "from-emerald-400 to-teal-600",
              title: "Keuangan Transparan",
              desc: "Dasbor pemasukan, pengeluaran & laba untuk pemilik.",
              href: "/keuangan",
              cta: "Lihat Dasbor",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="glass rounded-3xl p-6 hover:border-white/30 hover:scale-[1.02] transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-black shadow-lg group-hover:rotate-12 transition-transform`}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 font-black text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              <Link
                href={f.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-300 hover:gap-2 transition-all"
              >
                {f.cta} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CARA PESAN ============ */}
      <section className="border-y border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-2xl sm:text-4xl font-black">
            Pesan dalam <span className="text-amber-300">4 Langkah</span> ⚡
          </h2>
          <div className="mt-10 grid sm:grid-cols-4 gap-4">
            {[
              { e: "📝", t: "1. Daftar Akun", d: "Gratis + bonus 50 poin langsung!" },
              { e: "🍛", t: "2. Pilih Menu", d: "20+ hidangan autentik siap dipilih" },
              { e: "💳", t: "3. Bayar Fleksibel", d: "Tunai, QRIS, transfer, atau poin" },
              { e: "🎁", t: "4. Panen Poin", d: "Tukar poin jadi makan gratis!" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="glass rounded-3xl p-6 text-center relative"
              >
                <p className="text-5xl">{s.e}</p>
                <p className="mt-3 font-black">{s.t}</p>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
                {i < 3 && (
                  <span className="hidden sm:block absolute top-1/2 -right-3 text-amber-400 text-xl">
                    →
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONI + CTA ============ */}
      <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black">
            Kata <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">Pelanggan</span> 💬
          </h2>
          <div className="mt-6 space-y-4">
            {[
              { n: "Bu Ratna", a: "👩", t: "Rendangnya juara! Pesan online datang masih panas. Poinnya sudah saya tukar ayam pop gratis 2x.", s: 5 },
              { n: "Pak Budi", a: "👨", t: "Anak saya ketagihan game tangkap cabainya 😂 Sambil nunggu makanan, dia dapat poin pula!", s: 5 },
              { n: "Kak Salsa", a: "👧", t: "Level saya sudah Emas! Tiap makan di sini selalu dapat poin. UI-nya keren kayak aplikasi masa depan.", s: 5 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.a}</span>
                  <div>
                    <p className="font-bold">{t.n}</p>
                    <p className="text-xs text-amber-300">
                      {"★".repeat(t.s)} <span className="text-slate-500">• Terverifikasi</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">“{t.t}”</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-8 text-center relative overflow-hidden animate-glow"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-rose-500/15 pointer-events-none" />
            <p className="text-6xl">🎁</p>
            <h3 className="mt-4 text-2xl sm:text-3xl font-black">
              Daftar = Langsung Dapat <span className="text-amber-300">50 Poin!</span>
            </h3>
            <p className="mt-2 text-slate-400 text-sm">
              Senilai Rp 5.000 potongan. Tanpa syarat tersembunyi.
            </p>
            <Link
              href="/auth"
              className="btn-shine mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:scale-105 transition-transform"
            >
              <Sparkles size={20} /> Klaim Bonus Sekarang
            </Link>
            <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
              <Flame size={12} className="text-orange-400" /> 1.240 orang mendaftar bulan ini
            </p>
          </motion.div>
          <div className="glass rounded-3xl p-6">
            <p className="font-black flex items-center gap-2">
              <Star size={18} className="text-amber-300" /> Level Loyalty
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { l: "Perunggu", c: "from-amber-600 to-amber-800", d: "Mulai • cashback poin 1x" },
                { l: "Perak", c: "from-slate-300 to-slate-500", d: "Belanja 150rb • bonus ulang tahun" },
                { l: "Emas", c: "from-yellow-300 to-amber-500", d: "Belanja 500rb • gratis ongkir" },
                { l: "Platinum", c: "from-cyan-200 to-cyan-500", d: "Belanja 1jt • prioritas dapur" },
                { l: "Berlian", c: "from-violet-300 to-fuchsia-500", d: "Belanja 2jt • undangan makan VIP" },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-3 h-8 rounded-full bg-gradient-to-b ${x.c}`} />
                  <span className="font-bold w-20">{x.l}</span>
                  <span className="text-slate-400 text-xs">{x.d}</span>
                </div>
              ))}
            </div>
            <Link href="/loyalty" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-300">
              Pelajari program <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
