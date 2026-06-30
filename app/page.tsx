import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getServerSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getServerSession();
  if (session) redirect("/trips");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Group Trip Planner
        </h1>
        <p className="max-w-md text-zinc-500">
          Vote on destinations and dates, track the budget, and split expenses — all in one
          shared place.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/sign-up">
          <Button>Get started</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
