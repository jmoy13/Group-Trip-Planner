"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";

interface DateTimePickerProps {
  dateId: string;
  timeId: string;
  /** Name for the hidden field carrying the combined "yyyy-mm-ddTHH:mm" value. */
  name: string;
  label: string;
  /** Initial value in "yyyy-mm-ddTHH:mm" form (matches native datetime-local formatting). */
  defaultValue?: string;
}

function splitDateTimeLocal(value: string | undefined) {
  if (!value) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date: date ?? "", time: time ? time.slice(0, 5) : "" };
}

/** Calendar date picker + native time input, combined into one datetime-local-formatted hidden field. */
export function DateTimePicker({ dateId, timeId, name, label, defaultValue }: DateTimePickerProps) {
  const initial = splitDateTimeLocal(defaultValue);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);

  const combined = date ? `${date}T${time || "00:00"}` : "";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="flex gap-2">
        <div className="flex-1">
          <DatePicker id={dateId} value={date} onChange={setDate} placeholder="Date" />
        </div>
        <input
          type="time"
          id={timeId}
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
