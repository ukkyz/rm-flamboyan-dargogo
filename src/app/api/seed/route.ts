import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems, rewards, users, transactions } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { MENU_SEED, REWARD_SEED, SAMPLE_TXNS } from "@/db/seed-data";

/**
 * Seed idempotent. Tabel & data dasar sudah dibuat otomatis oleh bootstrap SQLite,
 * endpoint ini memastikan data demo tetap lengkap saat database dikosongkan.
 */
async function seed() {
  const existingMenu = await db.select().from(menuItems);
  if (existingMenu.length === 0) {
    for (const m of MENU_SEED) {
      await db.insert(menuItems).values(m);
    }
  }

  const existingRewards = await db.select().from(rewards);
  if (existingRewards.length === 0) {
    for (const r of REWARD_SEED) {
      await db.insert(rewards).values(r);
    }
  }

  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    await db.insert(users).values({
      name: "Admin RM Padang",
      email: "admin@rmpadang.id",
      passwordHash: await hashPassword("admin123"),
      role: "admin",
      points: 0,
      avatar: "👨‍🍳",
    });
    await db.insert(users).values({
      name: "Kasir Sinta",
      email: "kasir@rmpadang.id",
      passwordHash: await hashPassword("kasir123"),
      role: "kasir",
      points: 0,
      avatar: "👩‍💼",
    });
    await db.insert(users).values({
      name: "Demo Pelanggan",
      email: "demo@rmpadang.id",
      passwordHash: await hashPassword("demo123"),
      role: "customer",
      points: 150,
      totalSpent: 320000,
      level: "Perak",
      avatar: "🍛",
    });
    for (const s of SAMPLE_TXNS) {
      await db.insert(transactions).values({
        ...s,
        date: new Date(),
        createdBy: "Admin",
      });
    }
  }

  return { ok: true, message: "Seed berhasil" };
}

export async function POST() {
  try {
    return NextResponse.json(await seed());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed gagal" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
