import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches Auth.js's default
const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

/**
 * Reuses Auth.js's `VerificationToken` model (identifier = email) rather than a
 * dedicated table — its shape (single-use, expiring, looked up by token) already
 * fits a password reset token exactly.
 *
 * Returns null (without creating a token) if there's no password-based account for
 * this email, so the caller can still show a generic "check your email" message
 * without revealing whether the account exists.
 */
export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Only one active reset link per email at a time.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  return token;
}

export async function isPasswordResetTokenValid(token: string) {
  const record = await prisma.verificationToken.findFirst({ where: { token } });
  return !!record && record.expires > new Date();
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record || record.expires < new Date()) {
    return { success: false as const, error: "This reset link is invalid or has expired." };
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } });
  if (!user) {
    return { success: false as const, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }), // sign out everywhere on reset
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }),
  ]);

  return { success: true as const, userId: user.id };
}
