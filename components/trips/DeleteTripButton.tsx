"use client";

import { deleteTripAction } from "@/app/(dashboard)/trips/actions";

export function DeleteTripButton({ tripId, tripName }: { tripId: string; tripName: string }) {
  return (
    <form
      action={deleteTripAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${tripName}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tripId" value={tripId} />
      <button
        type="submit"
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete trip
      </button>
    </form>
  );
}
