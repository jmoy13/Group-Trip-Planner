import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches Auth.js's default
const SALT_ROUNDS = 12;

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
const SESSION_COOKIE_NAME = `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Creates a database Session row and sets the same cookie Auth.js's database
 * strategy expects, so this credentials login is indistinguishable from an
 * Auth.js-issued (e.g. Google) session to `auth()` and `proxy.ts`.
 */
export async function createDatabaseSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { sessionToken, userId, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies,
  });
}
