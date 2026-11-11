/**
 * Session management.
 *
 * - Random 256-bit session token, stored only as a SHA-256 hash in Postgres.
 * - The cookie value is `token.signature` (HMAC-SHA256 with AUTH_SECRET) so
 *   tampered cookies are rejected before touching the database.
 * - httpOnly + SameSite=Lax + Secure(in prod) cookies.
 * - Server Functions always re-check the session server-side.
 */

import "server-only";

import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "i111_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}

function signToken(token: string): string {
  return createHmac("sha256", getAuthSecret()).update(token).digest("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function encodeCookieValue(token: string): string {
  return `${token}.${signToken(token)}`;
}

function decodeCookieValue(value: string): string | null {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const token = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!safeEqual(signature, signToken(token))) return null;
  return token;
}

/** Create a new session for a user and set the session cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeCookieValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Delete the current session (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    const token = decodeCookieValue(raw);
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
    cookieStore.delete(SESSION_COOKIE);
  }
}

/** Resolve the authenticated user for this request (null when signed out). */
async function loadSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const token = decodeCookieValue(raw);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, email: true, name: true, timezone: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** Request-scoped cached session user (React `cache`). */
export const getCurrentUser = cache(loadSessionUser);

/** Like `getCurrentUser` but redirects to /login when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Remove expired sessions (called opportunistically on login). */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}

/** Hash of the current request's session token, if present. */
export async function getCurrentTokenHash(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const token = decodeCookieValue(raw);
  return token ? hashToken(token) : null;
}
