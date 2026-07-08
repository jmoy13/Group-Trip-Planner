"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm text-sage-500 hover:text-sage-900"
    >
      ← Back
    </button>
  );
}
