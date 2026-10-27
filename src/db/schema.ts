import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const now = () => new Date();

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "admin", "kasir"] })
    .default("customer")
    .notNull(),
  points: integer("points").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  level: text("level").default("Perunggu").notNull(),
  avatar: text("avatar").default("🍛").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  image: text("image"),
  emoji: text("emoji").default("🍛").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).default(true).notNull(),
  isSpicy: integer("is_spicy").default(0).notNull(),
  stock: integer("stock").default(100).notNull(),
  soldCount: integer("sold_count").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  userId: integer("user_id"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  type: text("type", { enum: ["dine_in", "takeaway", "delivery"] })
    .default("dine_in")
    .notNull(),
  tableNumber: text("table_number"),
  address: text("address"),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "cooking", "ready", "completed", "cancelled"] })
    .default("pending")
    .notNull(),
  subtotal: integer("subtotal").default(0).notNull(),
  discount: integer("discount").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  paymentMethod: text("payment_method").default("tunai").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  pointsUsed: integer("points_used").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id"),
  menuName: text("menu_name").notNull(),
  menuEmoji: text("menu_emoji").default("🍛").notNull(),
  qty: integer("qty").notNull(),
  price: integer("price").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  date: integer("date", { mode: "timestamp" }).notNull().$defaultFn(now),
  relatedOrderId: integer("related_order_id"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const pointHistory = sqliteTable("point_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["earn", "redeem", "bonus_game", "adjust"] }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  stock: integer("stock").default(50).notNull(),
  emoji: text("emoji").default("🎁").notNull(),
  image: text("image"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  redeemedCount: integer("redeemed_count").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const redemptions = sqliteTable("redemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id"),
  rewardName: text("reward_name").notNull(),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const gameScores = sqliteTable("game_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  playerName: text("player_name").notNull(),
  gameType: text("game_type").notNull(),
  score: integer("score").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});
