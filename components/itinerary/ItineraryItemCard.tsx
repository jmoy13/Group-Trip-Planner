"use client";

import { useActionState, useState, type DragEvent } from "react";
import {
  deleteItineraryItemAction,
  updateItineraryItemAction,
} from "@/app/(dashboard)/trips/[tripId]/itinerary/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

interface ItineraryItemCardProps {
  tripId: string;
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date | null;
  endTime: Date | null;
  dayIndex: number;
  createdByName: string | null;
  canEdit: boolean;
  draggable: boolean;
  onDragStartItem: () => void;
  onDragOverItem: (event: DragEvent) => void;
  onDropItem: () => void;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function toDateTimeLocalValue(date: Date | null) {
  if (!date) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ItineraryItemCard({
  tripId,
  id,
  title,
  description,
  location,
  startTime,
  endTime,
  dayIndex,
  createdByName,
  canEdit,
  draggable,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
}: ItineraryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateItineraryItemAction, undefined);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-sage-200 p-3">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="itemId" value={id} />
          <Input id={`title-${id}`} name="title" label="Title" defaultValue={title} required />
          <div className="flex gap-2">
            <DateTimePicker
              dateId={`start-date-${id}`}
              timeId={`start-time-${id}`}
              name="startTime"
              label="Start"
              defaultValue={toDateTimeLocalValue(startTime)}
            />
            <DateTimePicker
              dateId={`end-date-${id}`}
              timeId={`end-time-${id}`}
              name="endTime"
              label="End"
              defaultValue={toDateTimeLocalValue(endTime)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              id={`location-${id}`}
              name="location"
              label="Location"
              defaultValue={location ?? ""}
            />
            <Input
              id={`day-${id}`}
              name="dayIndex"
              type="number"
              min={1}
              label="Day"
              defaultValue={dayIndex}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`description-${id}`} className="text-sm font-medium text-sage-700">
              Description
            </label>
            <textarea
              id={`description-${id}`}
              name="description"
              rows={2}
              defaultValue={description ?? ""}
              className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="w-auto">
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-auto"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
        {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      </li>
    );
  }

  return (
    <li
      draggable={draggable}
      onDragStart={onDragStartItem}
      onDragOver={onDragOverItem}
      onDrop={onDropItem}
      className={`flex items-start justify-between gap-3 rounded-lg border border-sage-200 p-3 ${
        draggable ? "cursor-move" : ""
      }`}
    >
      <div>
        <p className="text-sm font-medium text-sage-900">{title}</p>
        {(startTime || endTime) && (
          <p className="text-xs text-sage-500">
            {startTime && timeFormatter.format(startTime)}
            {startTime && endTime && " – "}
            {endTime && timeFormatter.format(endTime)}
          </p>
        )}
        {location && <p className="text-xs text-sage-500">{location}</p>}
        {description && <p className="mt-1 text-sm text-sage-600">{description}</p>}
        <p className="mt-1 text-xs text-sage-400">Added by {createdByName ?? "a member"}</p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-sage-600 hover:underline"
          >
            Edit
          </button>
          <form action={deleteItineraryItemAction}>
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="itemId" value={id} />
            <button type="submit" className="text-xs text-red-600 hover:underline">
              Delete
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
