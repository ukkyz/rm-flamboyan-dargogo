import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RM Padang Nusantara — Rasa Autentik, Teknologi Futuristik",
  description:
    "Rumah Makan Padang modern: pesan online, loyalty poin, kelola keuangan, dan game memasak anak.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <div className="aurora-bg" />
        <div
          className="aurora-orb w-[480px] h-[480px] left-[-120px] top-[-80px]"
          style={{ background: "rgba(251,113,133,0.35)" }}
        />
        <div
          className="aurora-orb w-[520px] h-[520px] right-[-140px] top-[30%] hidden md:block"
          style={{ background: "rgba(251,191,36,0.28)", animationDelay: "-6s" }}
        />
        <div
          className="aurora-orb w-[420px] h-[420px] left-[30%] bottom-[-160px]"
          style={{ background: "rgba(139,92,246,0.3)", animationDelay: "-12s" }}
        />
        <Navbar />
        {children}
        <footer className="mt-16 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-xl font-black">
                <span className="text-3xl">🍛</span>
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  RM Padang Nusantara
                </span>
              </div>
              <p className="mt-3 text-slate-400">
                Cita rasa Minang autentik dengan pengalaman digital futuristik.
                Pesan online, kumpulkan poin, mainkan game anak!
              </p>
            </div>
            <div>
              <p className="font-bold text-amber-300 mb-3">Layanan</p>
              <ul className="space-y-2 text-slate-400">
                <li>Pesan Online</li>
                <li>Loyalty & Poin</li>
                <li>Tukar Hadiah</li>
                <li>Game Anak</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-amber-300 mb-3">Jam Buka</p>
              <ul className="space-y-2 text-slate-400">
                <li>Senin — Minggu</li>
                <li>08.00 — 22.00 WIB</li>
                <li className="text-emerald-300">● Buka Setiap Hari</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-amber-300 mb-3">Kontak</p>
              <ul className="space-y-2 text-slate-400">
                <li>📍 Jl. Raya Nusantara No. 45</li>
                <li>📞 0812-3456-7890</li>
                <li>✉️ halo@rmpadang.id</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
            © 2026 RM Padang Nusantara • Dibuat dengan ❤️ dan cabai hijau
          </div>
        </footer>
      </body>
    </html>
  );
}
