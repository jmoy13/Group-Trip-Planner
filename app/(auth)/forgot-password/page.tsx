import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-sage-900">Reset your password</h1>
        <p className="text-sm text-sage-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-sage-500">
        <Link href="/sign-in" className="font-medium text-sage-900 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
