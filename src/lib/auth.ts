import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "padang-futuristik-secret-key-2026"
);

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  points: number;
  level: string;
  avatar: string;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as number,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
      points: payload.points as number,
      level: (payload.level as string) || "Perunggu",
      avatar: (payload.avatar as string) || "🍛",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get("rm_session")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function levelForSpent(totalSpent: number): string {
  if (totalSpent >= 2000000) return "Berlian";
  if (totalSpent >= 1000000) return "Platinum";
  if (totalSpent >= 500000) return "Emas";
  if (totalSpent >= 150000) return "Perak";
  return "Perunggu";
}

export function pointsForAmount(amount: number): number {
  return Math.floor(amount / 10000);
}
