import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { isPasswordResetTokenValid } from "@/lib/auth/credentials";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  const valid = await isPasswordResetTokenValid(token);

  if (!valid) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-lg font-semibold text-sage-900">Invalid or expired link</h1>
        <p className="text-sm text-sage-500">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-sage-900 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-sage-900">Choose a new password</h1>
        <p className="text-sm text-sage-500">Enter a new password for your account.</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
