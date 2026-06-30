"use client";

import { useState, type DragEvent } from "react";
import { reorderItineraryItemsAction } from "@/app/(dashboard)/trips/[tripId]/itinerary/actions";
import { ItineraryItemCard } from "@/components/itinerary/ItineraryItemCard";

interface Item {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date | null;
  endTime: Date | null;
  dayIndex: number;
  createdBy: { id: string; name: string | null };
}

interface ItineraryDayGroupProps {
  tripId: string;
  dayIndex: number;
  items: Item[];
  currentUserId: string;
  isOwner: boolean;
}

export function ItineraryDayGroup({
  tripId,
  dayIndex,
  items,
  currentUserId,
  isOwner,
}: ItineraryDayGroupProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);

  const [lastItems, setLastItems] = useState(items);
  if (items !== lastItems) {
    setLastItems(items);
    setOrderedItems(items);
  }

  const canReorder = orderedItems.length > 1;

  function handleDragOver(event: DragEvent, targetId: string) {
    event.preventDefault();
    if (!dragId || dragId === targetId) return;

    setOrderedItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === dragId);
      const toIndex = current.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleDrop() {
    if (!dragId) return;
    setDragId(null);
    void reorderItineraryItemsAction(
      tripId,
      dayIndex,
      orderedItems.map((item) => item.id)
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-700">Day {dayIndex}</h3>
      <ul className="flex flex-col gap-2">
        {orderedItems.map((item) => (
          <ItineraryItemCard
            key={item.id}
            tripId={tripId}
            id={item.id}
            title={item.title}
            description={item.description}
            location={item.location}
            startTime={item.startTime}
            endTime={item.endTime}
            dayIndex={item.dayIndex}
            createdByName={item.createdBy.name}
            canEdit={item.createdBy.id === currentUserId || isOwner}
            draggable={canReorder}
            onDragStartItem={() => setDragId(item.id)}
            onDragOverItem={(event) => handleDragOver(event, item.id)}
            onDropItem={handleDrop}
          />
        ))}
      </ul>
    </div>
  );
}
