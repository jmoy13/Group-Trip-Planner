import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SignInForm } from "@/components/auth/SignInForm";
import { getServerSession } from "@/lib/auth/session";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, email } = await searchParams;

  const session = await getServerSession();
  if (session) redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/trips");

  const signUpHref = callbackUrl
    ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}${email ? `&email=${encodeURIComponent(email)}` : ""}`
    : "/sign-up";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="text-sm text-zinc-500">Welcome back. Plan your next trip together.</p>
      </div>
      <SignInForm callbackUrl={callbackUrl} defaultEmail={email} />
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200" />
        or
        <div className="h-px flex-1 bg-zinc-200" />
      </div>
      <GoogleSignInButton callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href={signUpHref} className="font-medium text-zinc-900 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
