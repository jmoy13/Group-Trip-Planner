"use client";

import { useEffect, useRef, useState } from "react";

interface DatePickerProps {
  id: string;
  /** Name for the hidden form field. Omit when used inside a compound picker that manages its own hidden field. */
  name?: string;
  label?: string;
  /** Controlled ISO date (yyyy-mm-dd). If provided, the component ignores its own selection state. */
  value?: string;
  /** Initial ISO date (yyyy-mm-dd) for uncontrolled usage. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseISODate(value: string | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const displayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Calendar-only date field — no typing, click a day to select. */
export function DatePicker({
  id,
  name,
  label,
  value,
  defaultValue,
  onChange,
  required,
  min,
  max,
  placeholder = "Select date",
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<Date | null>(() =>
    parseISODate(defaultValue)
  );
  const selected = isControlled ? parseISODate(value) : internalSelected;

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  function isDisabled(date: Date) {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function selectDate(date: Date) {
    if (!isControlled) setInternalSelected(date);
    onChange?.(toISODate(date));
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-sage-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((prev) => !prev)}
          className="w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-left text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400"
        >
          {selected ? displayFormatter.format(selected) : placeholder}
        </button>
        {name && (
          <input
            type="hidden"
            name={name}
            value={selected ? toISODate(selected) : ""}
            required={required}
          />
        )}
        {open && (
          <div className="absolute z-10 mt-1 w-64 rounded-lg border border-sage-200 bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="rounded px-2 py-1 text-sm text-sage-500 hover:bg-sage-100"
                aria-label="Previous month"
              >
                ←
              </button>
              <span className="text-sm font-medium text-sage-900">
                {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="rounded px-2 py-1 text-sm text-sage-500 hover:bg-sage-100"
                aria-label="Next month"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-sage-400">
              {WEEKDAYS.map((weekday, i) => (
                <span key={i}>{weekday}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                if (!date) return <span key={i} />;
                const disabled = isDisabled(date);
                const isSelected = selected !== null && isSameDay(date, selected);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(date)}
                    className={`rounded-md py-1 text-sm ${
                      isSelected
                        ? "bg-sage-900 text-white"
                        : disabled
                          ? "cursor-not-allowed text-sage-300"
                          : "text-sage-700 hover:bg-sage-100"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
