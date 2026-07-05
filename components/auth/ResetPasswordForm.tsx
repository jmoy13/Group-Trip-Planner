"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const actionWithToken = resetPasswordAction.bind(null, token);
  const [state, action, pending] = useActionState(actionWithToken, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input id="password" name="password" type="password" label="New password" required />
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
