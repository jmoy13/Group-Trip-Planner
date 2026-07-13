import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar, type BreadcrumbItem } from "@/components/layout/TopBar";
import type { SidebarNavItem } from "@/components/layout/SidebarNavLinks";

interface AppShellProps {
  nav: SidebarNavItem[];
  breadcrumb: BreadcrumbItem[];
  userName: string;
  userEmail: string;
  userImage?: string | null;
  children: React.ReactNode;
}

export function AppShell({ nav, breadcrumb, userName, userEmail, userImage, children }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1">
      <Sidebar nav={nav} />
      <div className="flex flex-1 flex-col">
        <TopBar breadcrumb={breadcrumb} userName={userName} userEmail={userEmail} userImage={userImage} />
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </div>
    </div>
  );
}
