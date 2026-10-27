import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, pointHistory, redemptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

  const uRows = await db.select().from(users).where(eq(users.id, session.id));
  const u = uRows[0];
  if (!u) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const history = await db
    .select()
    .from(pointHistory)
    .where(eq(pointHistory.userId, u.id))
    .orderBy(desc(pointHistory.createdAt))
    .limit(50);

  const myRedemptions = await db
    .select()
    .from(redemptions)
    .where(eq(redemptions.userId, u.id))
    .orderBy(desc(redemptions.createdAt))
    .limit(30);

  // leaderboard
  const leaders = await db.select().from(users).orderBy(desc(users.points)).limit(10);

  return NextResponse.json({
    me: {
      id: u.id,
      name: u.name,
      points: u.points,
      level: u.level,
      totalSpent: u.totalSpent,
      avatar: u.avatar,
    },
    history,
    redemptions: myRedemptions,
    leaderboard: leaders.map((l) => ({
      name: l.name,
      points: l.points,
      level: l.level,
      avatar: l.avatar,
    })),
  });
}
