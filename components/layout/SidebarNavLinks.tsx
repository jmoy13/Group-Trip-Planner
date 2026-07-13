"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface SidebarNavItem {
  href: string;
  label: string;
  /** Pre-rendered icon element, not a component reference — this array crosses the
   *  server/client boundary into this "use client" component, and functions can't be
   *  serialized across that boundary, only already-rendered JSX. */
  icon: ReactNode;
  badge?: number;
  exact?: boolean;
}

export function SidebarNavLinks({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-sage-100 text-sage-900" : "text-sage-600 hover:bg-sage-50 hover:text-sage-900"
            }`}
          >
            <span className="h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-sage-900 px-1.5 py-0.5 text-xs font-medium text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
