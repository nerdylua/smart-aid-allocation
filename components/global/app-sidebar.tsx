"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavSection } from "@/components/navigation/nav-section"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { type LucideIcon, LogOut, ChevronUp } from "lucide-react"
import defaultConfig from "@/lib/config/sidebar"
import { signOut } from "@/lib/supabase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  disabled?: boolean
}

type NavSectionType = {
  label: string
  items: NavItem[]
}

export type SidebarConfig = {
  brand?: {
    title: string
    icon?: LucideIcon
    href?: string
  }
  sections: NavSectionType[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  config?: SidebarConfig
}

export function AppSidebar({ config = defaultConfig, ...props }: AppSidebarProps) {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="relative border-b border-border/10 px-6 py-5 backdrop-blur-xl">
          <Link href={config.brand?.href || "/"} className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Image
                src="/logo.svg"
                alt={`${config.brand?.title || "Sahaya"} logo`}
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {config.brand?.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Community Need Intelligence
              </p>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <div className="space-y-2 py-2">
          {config.sections.map((section, index) => (
            <NavSection 
              key={section.label + index}
              label={section.label}
              items={section.items}
            />
          ))}
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" />
                }
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {(user.user_metadata?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.user_metadata?.full_name ?? "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronUp className="ml-auto h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56"
                align="start"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
