import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["customer", "admin", "kasir"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "cooking",
  "ready",
  "completed",
  "cancelled",
]);
export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway", "delivery"]);
export const txnTypeEnum = pgEnum("txn_type", ["income", "expense"]);
export const pointTypeEnum = pgEnum("point_type", ["earn", "redeem", "bonus_game", "adjust"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  points: integer("points").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  level: varchar("level", { length: 30 }).default("Perunggu").notNull(),
  avatar: varchar("avatar", { length: 10 }).default("🍛").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  image: varchar("image", { length: 255 }),
  emoji: varchar("emoji", { length: 10 }).default("🍛").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  isSpicy: integer("is_spicy").default(0).notNull(),
  stock: integer("stock").default(100).notNull(),
  soldCount: integer("sold_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  userId: integer("user_id"),
  customerName: varchar("customer_name", { length: 120 }),
  customerPhone: varchar("customer_phone", { length: 30 }),
  type: orderTypeEnum("type").default("dine_in").notNull(),
  tableNumber: varchar("table_number", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  status: orderStatusEnum("status").default("pending").notNull(),
  subtotal: integer("subtotal").default(0).notNull(),
  discount: integer("discount").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  paymentMethod: varchar("payment_method", { length: 40 }).default("tunai").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  pointsUsed: integer("points_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id"),
  menuName: varchar("menu_name", { length: 120 }).notNull(),
  menuEmoji: varchar("menu_emoji", { length: 10 }).default("🍛").notNull(),
  qty: integer("qty").notNull(),
  price: integer("price").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: txnTypeEnum("type").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
  relatedOrderId: integer("related_order_id"),
  createdBy: varchar("created_by", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pointHistory = pgTable("point_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: pointTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  stock: integer("stock").default(50).notNull(),
  emoji: varchar("emoji", { length: 10 }).default("🎁").notNull(),
  image: varchar("image", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  redeemedCount: integer("redeemed_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id"),
  rewardName: varchar("reward_name", { length: 120 }).notNull(),
  pointsSpent: integer("points_spent").notNull(),
  status: varchar("status", { length: 30 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  playerName: varchar("player_name", { length: 120 }).notNull(),
  gameType: varchar("game_type", { length: 60 }).notNull(),
  score: integer("score").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
