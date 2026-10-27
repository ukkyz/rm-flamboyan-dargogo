import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, users, pointHistory, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, levelForSpent, pointsForAmount } from "@/lib/auth";
import { orderCode } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");
  const status = searchParams.get("status");

  let rows;
  if (mine === "1" && session) {
    rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.id))
      .orderBy(desc(orders.createdAt))
      .limit(50);
  } else {
    if (!session || (session.role !== "admin" && session.role !== "kasir")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  }

  let filtered = rows;
  if (status && status !== "all") {
    filtered = rows.filter((r) => r.status === status);
  }

  // ambil items untuk setiap order
  const withItems = await Promise.all(
    filtered.map(async (o) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
      return { ...o, items };
    })
  );
  return NextResponse.json({ orders: withItems });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const {
      items,
      type = "dine_in",
      tableNumber,
      address,
      notes,
      customerName,
      customerPhone,
      paymentMethod = "tunai",
      usePoints = 0,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }

    // hitung subtotal dari harga DB
    let subtotal = 0;
    const detailed: { menuId: number | null; name: string; emoji: string; qty: number; price: number; subtotal: number }[] = [];
    for (const it of items) {
      const menuRows = await db.select().from(menuItems).where(eq(menuItems.id, Number(it.menuId)));
      const menu = menuRows[0];
      if (!menu) continue;
      const qty = Math.max(1, Math.min(50, Number(it.qty) || 1));
      const price = menu.price;
      subtotal += price * qty;
      detailed.push({
        menuId: menu.id,
        name: menu.name,
        emoji: menu.emoji,
        qty,
        price,
        subtotal: price * qty,
      });
      // kurangi stok & tambah sold
      await db
        .update(menuItems)
        .set({ stock: Math.max(0, menu.stock - qty), soldCount: (menu.soldCount || 0) + qty })
        .where(eq(menuItems.id, menu.id));
    }

    if (detailed.length === 0) {
      return NextResponse.json({ error: "Menu tidak valid" }, { status: 400 });
    }

    // diskon poin: 1 poin = Rp 100, maks 30% subtotal
    let pointsUsed = 0;
    let discount = 0;
    if (session && usePoints > 0) {
      const uRows = await db.select().from(users).where(eq(users.id, session.id));
      const u = uRows[0];
      if (u) {
        const maxDiscount = Math.floor(subtotal * 0.3);
        const wantDiscount = Math.min(Number(usePoints) * 100, u.points * 100, maxDiscount);
        discount = wantDiscount;
        pointsUsed = Math.floor(wantDiscount / 100);
      }
    }

    const total = Math.max(0, subtotal - discount);
    const pointsEarned = pointsForAmount(total);
    const code = orderCode();

    const inserted = await db
      .insert(orders)
      .values({
        code,
        userId: session?.id || null,
        customerName: customerName || session?.name || "Tamu",
        customerPhone: customerPhone || null,
        type,
        tableNumber: tableNumber || null,
        address: address || null,
        notes: notes || null,
        status: "pending",
        subtotal,
        discount,
        total,
        paymentMethod,
        pointsEarned,
        pointsUsed,
      })
      .returning();
    const order = inserted[0];

    for (const d of detailed) {
      await db.insert(orderItems).values({
        orderId: order.id,
        menuItemId: d.menuId,
        menuName: d.name,
        menuEmoji: d.emoji,
        qty: d.qty,
        price: d.price,
        subtotal: d.subtotal,
      });
    }

    // update poin user
    if (session) {
      const uRows = await db.select().from(users).where(eq(users.id, session.id));
      const u = uRows[0];
      if (u) {
        const newPoints = u.points - pointsUsed + pointsEarned;
        const newSpent = (u.totalSpent || 0) + total;
        const newLevel = levelForSpent(newSpent);
        await db
          .update(users)
          .set({ points: Math.max(0, newPoints), totalSpent: newSpent, level: newLevel })
          .where(eq(users.id, u.id));
        if (pointsUsed > 0) {
          await db.insert(pointHistory).values({
            userId: u.id,
            type: "redeem",
            amount: -pointsUsed,
            description: `Potongan pesanan ${code} (-${discount.toLocaleString("id-ID")})`,
          });
        }
        if (pointsEarned > 0) {
          await db.insert(pointHistory).values({
            userId: u.id,
            type: "earn",
            amount: pointsEarned,
            description: `Poin pesanan ${code}`,
          });
        }
      }
    }

    // catat pemasukan otomatis
    await db.insert(transactions).values({
      type: "income",
      category: "Penjualan",
      amount: total,
      description: `Pesanan ${code} (${detailed.length} item)`,
      relatedOrderId: order.id,
      createdBy: session?.name || customerName || "Tamu",
    });

    return NextResponse.json({ ok: true, order: { ...order, items: detailed } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "Data kurang" }, { status: 400 });

    // jika dibatalkan, kembalikan stok? sederhana: biarkan, tapi hapus transaksi income terkait
    if (status === "cancelled") {
      const oRows = await db.select().from(orders).where(eq(orders.id, Number(id)));
      const o = oRows[0];
      if (o && o.status !== "cancelled") {
        await db.delete(transactions).where(eq(transactions.relatedOrderId, Number(id)));
        // kembalikan poin yang dipakai & kurangi poin earned
        if (o.userId) {
          const uRows = await db.select().from(users).where(eq(users.id, o.userId));
          const u = uRows[0];
          if (u) {
            await db
              .update(users)
              .set({
                points: Math.max(0, u.points + (o.pointsUsed || 0) - (o.pointsEarned || 0)),
                totalSpent: Math.max(0, (u.totalSpent || 0) - o.total),
              })
              .where(eq(users.id, u.id));
            await db.insert(pointHistory).values({
              userId: u.id,
              type: "adjust",
              amount: (o.pointsUsed || 0) - (o.pointsEarned || 0),
              description: `Penyesuaian batal ${o.code}`,
            });
          }
        }
      }
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}
