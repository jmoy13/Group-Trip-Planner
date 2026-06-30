import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getServerSession } from "@/lib/auth/session";

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl, email } = await searchParams;

  const session = await getServerSession();
  if (session) redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/trips");

  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}${email ? `&email=${encodeURIComponent(email)}` : ""}`
    : "/sign-in";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Create an account</h1>
        <p className="text-sm text-zinc-500">Start planning a trip with your group.</p>
      </div>
      <SignUpForm callbackUrl={callbackUrl} defaultEmail={email} />
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200" />
        or
        <div className="h-px flex-1 bg-zinc-200" />
      </div>
      <GoogleSignInButton callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href={signInHref} className="font-medium text-zinc-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
