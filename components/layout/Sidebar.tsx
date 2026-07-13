import Link from "next/link";
import { MountainLogo } from "@/components/illustrations/Mountain";
import { PromoCard } from "@/components/layout/PromoCard";
import { SidebarNavLinks, type SidebarNavItem } from "@/components/layout/SidebarNavLinks";

export function Sidebar({ nav }: { nav: SidebarNavItem[] }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-sage-200 bg-sage-50 p-5">
      <Link href="/trips" className="flex items-center gap-2.5">
        <MountainLogo className="h-9 w-9 shrink-0" />
        <span className="leading-tight">
          <span className="block font-serif text-base font-bold text-sage-900">Group Trip</span>
          <span className="block text-[9px] font-medium tracking-[0.3em] text-sage-600">PLANNER</span>
        </span>
      </Link>

      <Link
        href="/trips/new"
        className="flex items-center justify-center gap-2 rounded-lg bg-sage-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-900"
      >
        + Create a Trip
      </Link>

      <SidebarNavLinks items={nav} />

      <div className="mt-auto">
        <PromoCard />
      </div>
    </aside>
  );
}
