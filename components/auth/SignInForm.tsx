"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SignInFormProps {
  callbackUrl?: string;
  defaultEmail?: string;
}

export function SignInForm({ callbackUrl, defaultEmail }: SignInFormProps) {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        defaultValue={defaultEmail}
        required
      />
      <Input id="password" name="password" type="password" label="Password" required />
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
