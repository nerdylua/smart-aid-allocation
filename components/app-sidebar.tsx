"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/supabase/auth";
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  UserCheck,
  HandHelping,
  MessageSquare,
  AlertTriangle,
  Search,
  MapPinned,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FolderOpen },
  { href: "/intake", label: "New Intake", icon: PlusCircle },
  { href: "/assignments", label: "Assignments", icon: UserCheck },
  { href: "/volunteers", label: "Volunteers", icon: HandHelping },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/volunteer-hub", label: "Find Cases", icon: Search },
  { href: "/itineraries", label: "Routes", icon: MapPinned },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-60 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">Sahaya</h1>
        <p className="text-xs text-muted-foreground">
          Community Need Intelligence
        </p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname?.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user.user_metadata?.full_name ?? user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
