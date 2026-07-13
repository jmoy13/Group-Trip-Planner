"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export function ShareTripButton({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(`${window.location.origin}/trips/${tripId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border border-sage-300 px-4 py-2 text-sm font-medium text-sage-900 transition-colors hover:bg-sage-50"
    >
      <ShareIcon className="h-4 w-4" />
      {copied ? "Link copied!" : "Share Trip"}
    </button>
  );
}
