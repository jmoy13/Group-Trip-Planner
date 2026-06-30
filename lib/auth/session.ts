import "server-only";
import { auth } from "@/auth";

export async function getServerSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
