import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopBarProps {
  breadcrumb: BreadcrumbItem[];
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function TopBar({ breadcrumb, userName, userEmail, userImage }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-sage-200 px-6 py-4">
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumb.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-sage-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="text-sage-500 hover:text-sage-900">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-sage-900">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <UserMenu name={userName} email={userEmail} image={userImage} />
    </header>
  );
}
