import type Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { MENU_SEED, REWARD_SEED, SAMPLE_TXNS } from "./seed-data";

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  points integer NOT NULL DEFAULT 0,
  total_spent integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Perunggu',
  avatar text NOT NULL DEFAULT '🍛',
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS menu_items (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  category text NOT NULL,
  image text,
  emoji text NOT NULL DEFAULT '🍛',
  is_available integer NOT NULL DEFAULT 1,
  is_spicy integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 100,
  sold_count integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS orders (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  code text NOT NULL UNIQUE,
  user_id integer,
  customer_name text,
  customer_phone text,
  type text NOT NULL DEFAULT 'dine_in',
  table_number text,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  subtotal integer NOT NULL DEFAULT 0,
  discount integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'tunai',
  points_earned integer NOT NULL DEFAULT 0,
  points_used integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS order_items (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_id integer NOT NULL,
  menu_item_id integer,
  menu_name text NOT NULL,
  menu_emoji text NOT NULL DEFAULT '🍛',
  qty integer NOT NULL,
  price integer NOT NULL,
  subtotal integer NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  amount integer NOT NULL,
  description text,
  date integer NOT NULL DEFAULT (unixepoch()),
  related_order_id integer,
  created_by text,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS point_history (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id integer NOT NULL,
  type text NOT NULL,
  amount integer NOT NULL,
  description text,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS rewards (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  stock integer NOT NULL DEFAULT 50,
  emoji text NOT NULL DEFAULT '🎁',
  image text,
  is_active integer NOT NULL DEFAULT 1,
  redeemed_count integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS redemptions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  code text NOT NULL UNIQUE,
  user_id integer NOT NULL,
  reward_id integer,
  reward_name text NOT NULL,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS game_scores (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id integer,
  player_name text NOT NULL,
  game_type text NOT NULL,
  score integer NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_points_user ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created ON game_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
`;

/**
 * Membuat seluruh tabel (idempotent) dan mengisi data awal bila masih kosong.
 * Dijalankan sekali per proses/node saat modul database dimuat.
 */
/**
 * Membuat seluruh tabel (idempotent) dan mengisi data awal bila masih kosong.
 * Seluruh pengecekan + insert dibungkus satu transaksi IMMEDIATE agar aman
 * ketika beberapa proses (build worker / node cluster) menginisialisasi bersamaan.
 */
export function bootstrapSqlite(sqlite: Database.Database) {
  // Jangan menulis apa pun saat fase build — tabel dibuat saat server berjalan.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  sqlite.exec(DDL);

  const seed = sqlite.transaction(() => {
    const menuCount = (sqlite.prepare("SELECT COUNT(*) as c FROM menu_items").get() as { c: number }).c;
    if (menuCount === 0) {
      const insertMenu = sqlite.prepare(
        `INSERT OR IGNORE INTO menu_items (name, description, price, category, emoji, is_available, is_spicy, stock, sold_count, created_at)
         VALUES (@name, @description, @price, @category, @emoji, 1, @isSpicy, @stock, 0, unixepoch())`
      );
      for (const m of MENU_SEED) insertMenu.run(m);
    }

    const rewardCount = (sqlite.prepare("SELECT COUNT(*) as c FROM rewards").get() as { c: number }).c;
    if (rewardCount === 0) {
      const insertReward = sqlite.prepare(
        `INSERT OR IGNORE INTO rewards (name, description, points_cost, emoji, stock, is_active, redeemed_count, created_at)
         VALUES (@name, @description, @pointsCost, @emoji, @stock, 1, 0, unixepoch())`
      );
      for (const r of REWARD_SEED) insertReward.run(r);
    }

    const userCount = (sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
    if (userCount === 0) {
      const insertUser = sqlite.prepare(
        `INSERT OR IGNORE INTO users (name, email, password_hash, role, points, total_spent, level, avatar, created_at)
         VALUES (@name, @email, @passwordHash, @role, @points, @totalSpent, @level, @avatar, unixepoch())`
      );
      const insertTxn = sqlite.prepare(
        `INSERT INTO transactions (type, category, amount, description, date, created_by, created_at)
         VALUES (@type, @category, @amount, @description, unixepoch(), 'Admin', unixepoch())`
      );
      insertUser.run({
        name: "Admin RM Padang",
        email: "admin@rmpadang.id",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
        points: 0,
        totalSpent: 0,
        level: "Perunggu",
        avatar: "👨‍🍳",
      });
      insertUser.run({
        name: "Kasir Sinta",
        email: "kasir@rmpadang.id",
        passwordHash: bcrypt.hashSync("kasir123", 10),
        role: "kasir",
        points: 0,
        totalSpent: 0,
        level: "Perunggu",
        avatar: "👩‍💼",
      });
      insertUser.run({
        name: "Demo Pelanggan",
        email: "demo@rmpadang.id",
        passwordHash: bcrypt.hashSync("demo123", 10),
        role: "customer",
        points: 150,
        totalSpent: 320000,
        level: "Perak",
        avatar: "🍛",
      });
      for (const t of SAMPLE_TXNS) insertTxn.run(t);
    }
  });

  seed.immediate();
}
