import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, pointHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createToken } from "@/lib/auth";

const AVATARS = ["🍛", "🍗", "🥘", "🍖", "🦐", "🐟", "🌶️", "🥥"];

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const bonus = 50; // bonus pendaftaran
    const inserted = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        passwordHash,
        role: "customer",
        points: bonus,
        avatar,
      })
      .returning();
    const user = inserted[0];
    await db.insert(pointHistory).values({
      userId: user.id,
      type: "earn",
      amount: bonus,
      description: "Bonus selamat datang 🎉",
    });
    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      level: user.level,
      avatar: user.avatar,
    });
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        avatar: user.avatar,
      },
    });
    res.cookies.set("rm_session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}
