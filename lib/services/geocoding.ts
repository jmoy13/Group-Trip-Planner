import "server-only";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Uses OSM Nominatim (free, no API key). Per Nominatim's usage policy this
 * requires an identifying User-Agent and must not be hammered — fine for the
 * "one lookup per propose-destination submit" volume this app generates.
 */
export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "group-trip-planner (destination map lookup)",
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    const results: Array<{ lat: string; lon: string }> = await res.json();
    const first = results[0];
    if (!first) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch {
    // Geocoding is best-effort — a failed/slow lookup shouldn't block proposing a destination.
    return null;
  }
}
