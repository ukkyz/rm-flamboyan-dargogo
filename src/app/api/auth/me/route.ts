import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  // refresh dari DB agar poin terbaru
  const rows = await db.select().from(users).where(eq(users.id, session.id));
  const u = rows[0];
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      points: u.points,
      level: u.level,
      avatar: u.avatar,
      totalSpent: u.totalSpent,
    },
  });
}
