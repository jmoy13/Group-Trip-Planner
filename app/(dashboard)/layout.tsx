import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BackButton } from "@/components/ui/BackButton";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const pendingInviteCount = session.user.email
    ? await prisma.tripInvitation.count({
        where: { email: session.user.email, status: "INVITED", expiresAt: { gt: new Date() } },
      })
    : 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-sage-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/trips" className="font-semibold text-sage-900 hover:text-sage-700">
            Group Trip Planner
          </Link>
          <Link href="/trips" className="text-sm text-sage-500 hover:text-sage-900">
            Home
          </Link>
          <Link
            href="/invites"
            className="flex items-center gap-1.5 text-sm text-sage-500 hover:text-sage-900"
          >
            Invites
            {pendingInviteCount > 0 && (
              <span className="rounded-full bg-sage-900 px-1.5 py-0.5 text-xs font-medium text-white">
                {pendingInviteCount}
              </span>
            )}
          </Link>
          <BackButton />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-sage-500">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
