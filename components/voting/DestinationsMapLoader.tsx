"use client";

import dynamic from "next/dynamic";
import type { MapDestination } from "@/components/voting/DestinationsMap";

// Leaflet touches `window` at import time, so it can't render on the server —
// load it only in the browser.
const DestinationsMap = dynamic(() => import("@/components/voting/DestinationsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg border border-sage-200 text-sm text-sage-400">
      Loading map…
    </div>
  ),
});

interface DestinationsMapLoaderProps {
  destinations: MapDestination[];
  highlightId?: string | null;
  heightClassName?: string;
}

export function DestinationsMapLoader(props: DestinationsMapLoaderProps) {
  return <DestinationsMap {...props} />;
}
