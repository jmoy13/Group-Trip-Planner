"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="font-medium text-sage-900">Something went wrong</h2>
      <p className="max-w-sm text-sm text-sage-500">
        {error.message || "An unexpected error occurred loading this trip."}
      </p>
      <Button onClick={reset} className="w-auto">
        Try again
      </Button>
    </div>
  );
}
