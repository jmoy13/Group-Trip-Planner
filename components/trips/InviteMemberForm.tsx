"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export function InviteMemberForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "loading" });

    const res = await fetch(`/api/trips/${tripId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Something went wrong." });
      return;
    }

    setStatus({ type: "success", message: `Invitation sent to ${email}.` });
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="invite-email"
            name="email"
            type="email"
            label="Invite by email"
            placeholder="friend@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-auto" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Sending…" : "Invite"}
        </Button>
      </div>
      {status.type === "error" && <p className="text-sm text-red-600">{status.message}</p>}
      {status.type === "success" && <p className="text-sm text-emerald-600">{status.message}</p>}
    </form>
  );
}
