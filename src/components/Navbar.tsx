"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  Wallet,
  Gift,
  Gamepad2,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

type Me = {
  id: number;
  name: string;
  email: string;
  role: string;
  points: number;
  level: string;
  avatar: string;
};

export default function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const load = async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await r.json();
      setMe(j.user || null);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    load();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    const t = setInterval(load, 5000);
    window.addEventListener("auth-changed", load);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("auth-changed", load);
      clearInterval(t);
    };
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
    router.refresh();
  };

  const links = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/menu", label: "Pesan", icon: UtensilsCrossed },
    { href: "/loyalty", label: "Loyalty", icon: Gift },
    { href: "/game", label: "Game Anak", icon: Gamepad2 },
    ...(me
      ? me.role === "admin" || me.role === "kasir"
        ? [
            { href: "/admin", label: "Admin", icon: LayoutDashboard },
            { href: "/keuangan", label: "Keuangan", icon: Wallet },
          ]
        : [{ href: "/dashboard", label: "Akun Saya", icon: User }]
      : []),
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:rotate-12 transition-transform animate-floaty">
              🍛
            </span>
            <div className="leading-tight">
              <p className="font-black text-sm sm:text-base bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                RM Flamboyan by Pak De Dargogo
              </p>
              <p className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">
                Futuristik • Autentik
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} />
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {me ? (
              <>
                <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm">
                  <span className="text-lg">{me.avatar}</span>
                  <div className="leading-tight">
                    <p className="font-bold text-xs max-w-[100px] truncate">{me.name}</p>
                    <p className="text-[11px] text-amber-300 flex items-center gap-1">
                      <Sparkles size={11} /> {me.points} poin • {me.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="btn-shine px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:scale-105 transition-transform shadow-[0_0_25px_rgba(251,191,36,0.5)]"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-xl glass"
            onClick={() => setOpen(!open)}
            aria-label="menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass-strong border-t border-white/10 px-4 py-4 space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${
                  active ? "bg-amber-400/20 text-amber-300" : "text-slate-200"
                }`}
              >
                <Icon size={18} /> {l.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10">
            {me ? (
              <div className="space-y-2">
                <div className="glass px-4 py-3 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">{me.avatar}</span>
                  <div>
                    <p className="font-bold">{me.name}</p>
                    <p className="text-xs text-amber-300">
                      {me.points} poin • Level {me.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-rose-500/20 text-rose-300"
                >
                  <LogOut size={18} /> Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="block text-center px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
