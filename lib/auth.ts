import "server-only";

import { Role, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "fake_market_session";
const SESSION_DAYS = 14;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function sign(value: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(givenBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function setSessionCookie(userId: string) {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession({ userId, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const payload = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      balance: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) {
    await clearSessionCookie();
    redirect("/login?error=account-inactive");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/markets?error=admin-only");
  return user;
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
export type AuthUser = Pick<User, "id" | "email" | "name" | "role" | "isActive" | "balance">;
