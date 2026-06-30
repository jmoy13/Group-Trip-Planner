import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getServerSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <span className="font-semibold text-zinc-900">Group Trip Planner</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
