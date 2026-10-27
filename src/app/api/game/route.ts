import { NextResponse } from "next/server";
import { db } from "@/db";
import { gameScores, users, pointHistory } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const top = await db.select().from(gameScores).orderBy(desc(gameScores.score)).limit(15);
  return NextResponse.json({ leaderboard: top });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { playerName, gameType, score, level = 1 } = body;
    if (!playerName || !gameType || typeof score !== "number") {
      return NextResponse.json({ error: "Data skor tidak valid" }, { status: 400 });
    }
    // konversi skor game ke poin loyalty: maks 20 poin per main, 1 poin per 100 skor
    let pointsEarned = Math.min(20, Math.floor(score / 100));
    // batasi: total bonus game per user per hari maks 60
    if (session && pointsEarned > 0) {
      const today = await db.execute(sql`
        SELECT COALESCE(SUM(points_earned),0)::int as total FROM game_scores
        WHERE user_id = ${session.id} AND created_at >= NOW() - INTERVAL '1 day'
      `);
      const usedToday = Number((today.rows[0] as { total: number })?.total || 0);
      const remaining = Math.max(0, 60 - usedToday);
      pointsEarned = Math.min(pointsEarned, remaining);
    }
    if (!session) pointsEarned = 0;

    const inserted = await db
      .insert(gameScores)
      .values({
        userId: session?.id || null,
        playerName: String(playerName).slice(0, 60),
        gameType: String(gameType).slice(0, 60),
        score: Math.max(0, Math.floor(score)),
        pointsEarned,
        level: Number(level) || 1,
      })
      .returning();

    if (session && pointsEarned > 0) {
      const uRows = await db.select().from(users);
      const u = uRows.find((x) => x.id === session.id);
      if (u) {
        await db.update(users).set({ points: u.points + pointsEarned }).where(sql`id = ${u.id}`);
        await db.insert(pointHistory).values({
          userId: u.id,
          type: "bonus_game",
          amount: pointsEarned,
          description: `Bonus game ${gameType} (${score} skor)`,
        });
      }
    }

    return NextResponse.json({ ok: true, entry: inserted[0], pointsEarned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan skor" }, { status: 500 });
  }
}
