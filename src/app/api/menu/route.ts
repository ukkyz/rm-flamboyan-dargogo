import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const items = await db.select().from(menuItems);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const inserted = await db
      .insert(menuItems)
      .values({
        name: body.name,
        description: body.description || "",
        price: Number(body.price),
        category: body.category || "Lauk",
        emoji: body.emoji || "🍛",
        image: body.image || null,
        isAvailable: body.isAvailable !== false,
        isSpicy: Number(body.isSpicy || 0),
        stock: Number(body.stock ?? 100),
      })
      .returning();
    return NextResponse.json({ item: inserted[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menambah menu" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    await db.update(menuItems).set(rest).where(eq(menuItems.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengubah menu" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
