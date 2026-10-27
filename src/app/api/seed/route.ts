import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems, rewards, users, transactions } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const MENU = [
  { name: "Rendang Sapi", description: "Rendang sapi empuk dimasak 8 jam dengan santan & rempah pilihan. Juara dunia!", price: 25000, category: "Lauk Utama", emoji: "🥩", isSpicy: 2, stock: 80 },
  { name: "Ayam Pop", description: "Ayam kampung rebus gurih dengan sambal merah khas.", price: 18000, category: "Lauk Utama", emoji: "🍗", isSpicy: 1, stock: 60 },
  { name: "Ayam Goreng Balado", description: "Ayam goreng renyah disiram sambal balado pedas manis.", price: 17000, category: "Lauk Utama", emoji: "🍖", isSpicy: 3, stock: 60 },
  { name: "Gulai Kepala Kakap", description: "Kepala kakap segar dimasak gulai kental gurih.", price: 35000, category: "Lauk Utama", emoji: "🐟", isSpicy: 2, stock: 25 },
  { name: "Dendeng Balado", description: "Daging sapi tipis pedas, renyah di luar lembut di dalam.", price: 22000, category: "Lauk Utama", emoji: "🥓", isSpicy: 3, stock: 50 },
  { name: "Sate Padang", description: "Sate daging dengan kuah kental kuning pedas gurih.", price: 20000, category: "Lauk Utama", emoji: "🍢", isSpicy: 2, stock: 70 },
  { name: "Gulai Tambusu", description: "Usus sapi isi tahu & telur, gulai legendaris.", price: 15000, category: "Lauk", emoji: "🍲", isSpicy: 2, stock: 40 },
  { name: "Perkedel Kentang", description: "Perkedel kentang gurih isi daging cincang.", price: 5000, category: "Pelengkap", emoji: "🥔", isSpicy: 0, stock: 100 },
  { name: "Telur Balado", description: "Telur rebus/goreng dengan sambal balado merah.", price: 8000, category: "Pelengkap", emoji: "🥚", isSpicy: 2, stock: 90 },
  { name: "Sayur Singkong", description: "Daun singkong rebus gurih pendamping wajib.", price: 7000, category: "Sayur", emoji: "🥬", isSpicy: 0, stock: 80 },
  { name: "Gulai Nangka", description: "Nangka muda dimasak santan gurih.", price: 10000, category: "Sayur", emoji: "🍈", isSpicy: 1, stock: 50 },
  { name: "Sambal Ijo", description: "Sambal cabai hijau legendaris, pedasnya nagih!", price: 5000, category: "Sambal", emoji: "🌶️", isSpicy: 3, stock: 100 },
  { name: "Nasi Putih", description: "Nasi hangat pulen dari beras pilihan.", price: 5000, category: "Nasi", emoji: "🍚", isSpicy: 0, stock: 200 },
  { name: "Nasi Bungkus Komplit", description: "Nasi + rendang + ayam + sayur + sambal. Paket hemat!", price: 30000, category: "Paket", emoji: "🍱", isSpicy: 2, stock: 100 },
  { name: "Paket Keluarga (4 orang)", description: "Nasi 4 + rendang 2 + ayam pop 2 + sayur + sambal + teh 4.", price: 120000, category: "Paket", emoji: "🎉", isSpicy: 2, stock: 30 },
  { name: "Es Teh Manis", description: "Teh manis dingin pelepas dahaga.", price: 5000, category: "Minuman", emoji: "🧋", isSpicy: 0, stock: 150 },
  { name: "Teh Talua", description: "Teh telur khas Minang dengan pinang & gula.", price: 10000, category: "Minuman", emoji: "☕", isSpicy: 0, stock: 60 },
  { name: "Jus Alpukat", description: "Alpukat segar + susu cokelat.", price: 12000, category: "Minuman", emoji: "🥑", isSpicy: 0, stock: 50 },
  { name: "Kerupuk Kulit", description: "Kerupuk jangek renyah gurih.", price: 8000, category: "Pelengkap", emoji: "🍘", isSpicy: 0, stock: 90 },
  { name: "Ikan Bakar", description: "Ikan segar bakar bumbu padang.", price: 28000, category: "Lauk Utama", emoji: "🐠", isSpicy: 2, stock: 35 },
];

const REWARDS = [
  { name: "Es Teh Gratis", description: "Tukar 1 es teh manis dingin gratis", pointsCost: 30, emoji: "🧋", stock: 100 },
  { name: "Perkedel Gratis", description: "2 pcs perkedel kentang gratis", pointsCost: 40, emoji: "🥔", stock: 80 },
  { name: "Ayam Pop Gratis", description: "1 potong ayam pop gratis", pointsCost: 120, emoji: "🍗", stock: 40 },
  { name: "Rendang Gratis", description: "1 potong rendang sapi gratis!", pointsCost: 180, emoji: "🥩", stock: 30 },
  { name: "Paket Komplit Gratis", description: "Nasi bungkus komplit gratis", pointsCost: 250, emoji: "🍱", stock: 20 },
  { name: "Voucher Rp 50.000", description: "Potongan Rp 50.000 untuk pembelian berikutnya", pointsCost: 350, emoji: "🎫", stock: 15 },
  { name: "Paket Keluarga Gratis", description: "Paket keluarga untuk 4 orang!", pointsCost: 600, emoji: "🎉", stock: 8 },
];

export async function POST() {
  try {
    const existingMenu = await db.select().from(menuItems);
    if (existingMenu.length === 0) {
      for (const m of MENU) {
        await db.insert(menuItems).values(m);
      }
    }
    const existingRewards = await db.select().from(rewards);
    if (existingRewards.length === 0) {
      for (const r of REWARDS) {
        await db.insert(rewards).values(r);
      }
    }
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      const adminHash = await hashPassword("admin123");
      const kasirHash = await hashPassword("kasir123");
      const demoHash = await hashPassword("demo123");
      await db.insert(users).values({
        name: "Admin RM Padang",
        email: "admin@rmpadang.id",
        passwordHash: adminHash,
        role: "admin",
        points: 0,
        avatar: "👨‍🍳",
      });
      await db.insert(users).values({
        name: "Kasir Sinta",
        email: "kasir@rmpadang.id",
        passwordHash: kasirHash,
        role: "kasir",
        points: 0,
        avatar: "👩‍💼",
      });
      await db.insert(users).values({
        name: "Demo Pelanggan",
        email: "demo@rmpadang.id",
        passwordHash: demoHash,
        role: "customer",
        points: 150,
        totalSpent: 320000,
        level: "Perak",
        avatar: "🍛",
      });
      // contoh transaksi keuangan awal
      const samples = [
        { type: "expense" as const, category: "Belanja Bahan", amount: 850000, description: "Daging sapi 10kg, ayam 15 ekor, santan, rempah" },
        { type: "expense" as const, category: "Gaji", amount: 1500000, description: "Gaji mingguan 3 karyawan" },
        { type: "expense" as const, category: "Operasional", amount: 250000, description: "Gas, listrik, air" },
        { type: "income" as const, category: "Penjualan", amount: 2350000, description: "Penjualan harian" },
        { type: "income" as const, category: "Penjualan", amount: 1980000, description: "Penjualan harian" },
        { type: "expense" as const, category: "Belanja Bahan", amount: 620000, description: "Ikan, sayur, beras 50kg" },
      ];
      for (const s of samples) {
        await db.insert(transactions).values({ ...s, createdBy: "Admin" });
      }
    }
    return NextResponse.json({ ok: true, message: "Seed berhasil" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed gagal" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
