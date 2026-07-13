"use client";

import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { ChevronDownIcon } from "@/components/icons";

interface UserMenuProps {
  name: string;
  email: string;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = name.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-sage-900 hover:bg-sage-100"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-800 text-sm font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline">{name}</span>
        <ChevronDownIcon className="h-4 w-4 text-sage-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-sage-200 bg-white p-2 shadow-lg">
          <p className="truncate px-2 py-1.5 text-xs text-sage-500">{email}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-sage-700 hover:bg-sage-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
