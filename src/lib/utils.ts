export function rupiah(n: number): string {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

export function shortDate(d: string | Date): string {
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export function orderCode(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 900 + 100);
  return `PDG-${t}-${r}`;
}

export function redeemCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `HADIAH-${s}`;
}

export const LEVEL_COLORS: Record<string, string> = {
  Perunggu: "from-amber-600 to-amber-800",
  Perak: "from-slate-300 to-slate-500",
  Emas: "from-yellow-300 to-amber-500",
  Platinum: "from-cyan-200 to-cyan-500",
  Berlian: "from-violet-300 to-fuchsia-500",
};

export const LEVEL_NEED: Record<string, number> = {
  Perunggu: 150000,
  Perak: 500000,
  Emas: 1000000,
  Platinum: 2000000,
  Berlian: 2000000,
};
