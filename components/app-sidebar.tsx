"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/supabase/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/cases", label: "Cases", icon: "📋" },
  { href: "/intake", label: "New Intake", icon: "➕" },
  { href: "/assignments", label: "Assignments", icon: "👤" },
  { href: "/volunteers", label: "Volunteers", icon: "🤝" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/incidents", label: "Incidents", icon: "🚨" },
  { href: "/volunteer-hub", label: "Find Cases", icon: "🔍" },
  { href: "/itineraries", label: "Routes", icon: "🗺️" },
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
            <span>{item.icon}</span>
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
