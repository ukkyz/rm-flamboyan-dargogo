import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi" }, { status: 400 });
    }
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
    }
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
    return NextResponse.json({ error: "Gagal masuk" }, { status: 500 });
  }
}
