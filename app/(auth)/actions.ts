"use server";

import { redirect } from "next/navigation";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { createDatabaseSession, hashPassword, verifyPassword } from "@/lib/auth/credentials";
import { prisma } from "@/lib/db";
import { SignInSchema, SignUpSchema } from "@/lib/validation/auth";

type ActionResult = { success: true } | { success: false; error: string };

/** Only allow same-origin relative redirects (never an absolute/external URL). */
function resolveCallbackUrl(formData: FormData, fallback = "/trips") {
  const value = formData.get("callbackUrl");
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

export async function signUpAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  await createDatabaseSession(user.id);
  redirect(resolveCallbackUrl(formData));
}

export async function signInAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, error: "Invalid email or password." };
  }

  await createDatabaseSession(user.id);
  redirect(resolveCallbackUrl(formData));
}

export async function signInWithGoogleAction(formData: FormData) {
  await authSignIn("google", { redirectTo: resolveCallbackUrl(formData) });
}

export async function signOutAction() {
  await authSignOut({ redirectTo: "/sign-in" });
}
