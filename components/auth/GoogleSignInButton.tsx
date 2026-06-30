import { signInWithGoogleAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <form action={signInWithGoogleAction}>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <Button type="submit" variant="secondary">
        Continue with Google
      </Button>
    </form>
  );
}
