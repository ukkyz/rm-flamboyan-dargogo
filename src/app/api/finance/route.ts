import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, orders } from "@/db/schema";
import { desc, eq, sql, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 30);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const txns = await db
    .select()
    .from(transactions)
    .where(gte(transactions.date, since))
    .orderBy(desc(transactions.date))
    .limit(200);

  const totals = await db
    .select({
      type: transactions.type,
      sum: sql<number>`COALESCE(SUM(${transactions.amount}),0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(gte(transactions.date, since))
    .groupBy(transactions.type);

  let income = 0,
    expense = 0;
  for (const t of totals) {
    if (t.type === "income") income = Number(t.sum);
    else expense = Number(t.sum);
  }

  // harian 14 hari
  const daily = await db.execute(sql`
    SELECT to_char(date, 'DD Mon') as label,
           SUM(CASE WHEN type='income' THEN amount ELSE 0 END)::int as income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::int as expense
    FROM transactions
    WHERE date >= NOW() - INTERVAL '14 days'
    GROUP BY to_char(date, 'DD Mon'), date_trunc('day', date)
    ORDER BY date_trunc('day', date) ASC
  `);

  // kategori pengeluaran
  const byCat = await db.execute(sql`
    SELECT category, SUM(amount)::int as total
    FROM transactions
    WHERE type='expense' AND date >= NOW() - INTERVAL '30 days'
    GROUP BY category ORDER BY total DESC
  `);

  // order stats
  const orderStats = await db.execute(sql`
    SELECT status, COUNT(*)::int as count, COALESCE(SUM(total),0)::int as total
    FROM orders GROUP BY status
  `);

  return NextResponse.json({
    txns,
    summary: {
      income,
      expense,
      profit: income - expense,
      margin: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    },
    daily: daily.rows,
    byCat: byCat.rows,
    orderStats: orderStats.rows,
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
        type,
        category,
        amount: Number(amount),
        description: description || "",
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
  await db.delete(transactions).where(eq(transactions.id, id));
  return NextResponse.json({ ok: true });
}
