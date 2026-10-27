import { NextResponse } from "next/server";
import { db } from "@/db";
import { rewards, users, redemptions, pointHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redeemCode } from "@/lib/utils";

export async function GET() {
  const items = await db.select().from(rewards).orderBy(rewards.pointsCost);
  return NextResponse.json({ rewards: items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Harus masuk dulu" }, { status: 401 });
  try {
    const { rewardId } = await req.json();
    const rRows = await db.select().from(rewards).where(eq(rewards.id, Number(rewardId)));
    const reward = rRows[0];
    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: "Hadiah tidak tersedia" }, { status: 400 });
    }
    if (reward.stock <= 0) {
      return NextResponse.json({ error: "Stok hadiah habis" }, { status: 400 });
    }
    const uRows = await db.select().from(users).where(eq(users.id, session.id));
    const u = uRows[0];
    if (!u) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    if (u.points < reward.pointsCost) {
      return NextResponse.json({ error: `Poin kurang! Butuh ${reward.pointsCost}, kamu punya ${u.points}` }, { status: 400 });
    }
    const code = redeemCode();
    await db
      .update(users)
      .set({ points: u.points - reward.pointsCost })
      .where(eq(users.id, u.id));
    await db
      .update(rewards)
      .set({ stock: reward.stock - 1, redeemedCount: (reward.redeemedCount || 0) + 1 })
      .where(eq(rewards.id, reward.id));
    await db.insert(pointHistory).values({
      userId: u.id,
      type: "redeem",
      amount: -reward.pointsCost,
      description: `Tukar ${reward.name} (${code})`,
    });
    const inserted = await db
      .insert(redemptions)
      .values({
        code,
        userId: u.id,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
        status: "active",
      })
      .returning();
    return NextResponse.json({ ok: true, redemption: inserted[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menukar poin" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // admin: kelola reward / tandai voucher dipakai
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (body.useCode) {
      const rows = await db.select().from(redemptions);
      const found = rows.find((r) => r.code === body.useCode);
      if (!found) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });
      if (found.status === "used") return NextResponse.json({ error: "Kode sudah dipakai" }, { status: 400 });
      await db.update(redemptions).set({ status: "used" }).where(eq(redemptions.id, found.id));
      return NextResponse.json({ ok: true, redemption: { ...found, status: "used" } });
    }
    if (body.id) {
      const { id, ...rest } = body;
      await db.update(rewards).set(rest).where(eq(rewards.id, Number(id)));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Data kurang" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}
