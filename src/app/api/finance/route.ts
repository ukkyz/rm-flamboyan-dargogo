import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, orders } from "@/db/schema";
import { desc, eq, gte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

type Daily = { label: string; income: number; expense: number };

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 30);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const txns = await db
    .select()
    .from(transactions)
    .where(gte(transactions.date, since))
    .orderBy(desc(transactions.date))
    .limit(500);

  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // agregasi harian 14 hari terakhir
  const dailyMap = new Map<string, Daily>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, {
      label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      income: 0,
      expense: 0,
    });
  }
  for (const t of txns) {
    const key = new Date(t.date).toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }
  const daily = Array.from(dailyMap.values());

  // kategori pengeluaran
  const catMap = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "expense") continue;
    catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
  }
  const byCat = Array.from(catMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // statistik pesanan
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
  const statusMap = new Map<string, { count: number; total: number }>();
  for (const o of allOrders) {
    const cur = statusMap.get(o.status) || { count: 0, total: 0 };
    if (o.status !== "cancelled") {
      statusMap.set(o.status, { count: cur.count + 1, total: cur.total + o.total });
    } else {
      statusMap.set(o.status, { count: cur.count + 1, total: cur.total });
    }
  }
  const orderStats = Array.from(statusMap.entries()).map(([status, v]) => ({
    status,
    count: v.count,
    total: v.total,
  }));

  return NextResponse.json({
    txns,
    summary: {
      income,
      expense,
      profit: income - expense,
      margin: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    },
    daily,
    byCat,
    orderStats,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { type, category, amount, description } = body;
    if (!type || !category || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Data transaksi tidak valid" }, { status: 400 });
    }
    const inserted = await db
      .insert(transactions)
      .values({
        type: type === "income" ? "income" : "expense",
        category,
        amount: Number(amount),
        description: description || "",
        date: new Date(),
        createdBy: session.name,
      })
      .returning();
    return NextResponse.json({ txn: inserted[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await db.delete(transactions).where(and(eq(transactions.id, id)));
  return NextResponse.json({ ok: true });
}
