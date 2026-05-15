"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Home, Building2, BedDouble, Users, BarChart2, User, Wallet, AlertCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

const landlordNav = [
  { label: "Overview", href: "/landlord", icon: Home, exact: true },
  { label: "Properties", href: "/landlord/properties", icon: Building2 },
  { label: "Rooms", href: "/landlord/rooms", icon: BedDouble },
  { label: "Tenants", href: "/landlord/tenants", icon: Users },
]

const tenantNav = [
  { label: "My Rooms", href: "/tenant", icon: BedDouble, exact: true },
  { label: "Escrow", href: "/tenant/escrow", icon: Wallet },
]

const adminNav = [
  { label: "Overview", href: "/admin", icon: Home, exact: true },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Users", href: "/admin/users", icon: User },
  { label: "Properties", href: "/admin/properties", icon: Building2 },
  { label: "Disputes", href: "/admin/disputes", icon: AlertCircle },
]

function NavItems({ items }: { items: typeof landlordNav }) {
  const pathname = usePathname()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={cn(
              "h-9 gap-3 rounded-lg transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-2 border-sidebar-primary -ml-px pl-[13px]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
              <Link href={item.href}>
                <Icon size={16} className={active ? "text-sidebar-primary" : ""} />
                <span className="text-sm">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <span className="text-lg font-black tracking-tight text-sidebar-primary">Caushun</span>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <Skeleton className="h-3 w-16 mx-2 mb-3" />
          <div className="space-y-1 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border space-y-1">
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === "loading") return <SidebarSkeleton />

  const role = session?.user?.role
  const navItems = role === "landlord" ? landlordNav : role === "tenant" ? tenantNav : adminNav
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Admin"
  const settingsActive = pathname.startsWith("/settings")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-sidebar-primary">Caushun</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-1 uppercase tracking-widest text-[10px] text-sidebar-foreground/40 font-semibold">
            {roleLabel}
          </SidebarGroupLabel>
          <NavItems items={navItems} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border space-y-1">
        {/* Settings link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={settingsActive} tooltip="Settings" className={cn(
              "h-9 gap-3 rounded-lg transition-all",
              settingsActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-2 border-sidebar-primary -ml-px pl-[13px]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
              <Link href="/settings">
                <Settings size={16} className={settingsActive ? "text-sidebar-primary" : ""} />
                <span className="text-sm">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User card */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-xs font-bold bg-sidebar-accent text-sidebar-accent-foreground">
              {session?.user?.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold truncate text-sidebar-foreground">
              {session?.user?.fullName || session?.user?.name || "User"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate font-mono">
              {session?.user?.walletAddress
                ? `${session.user.walletAddress.slice(0, 6)}…${session.user.walletAddress.slice(-4)}`
                : "No wallet linked"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] uppercase shrink-0 border-sidebar-border font-semibold group-data-[collapsible=icon]:hidden",
              role === "admin" && "border-amber-500/40 text-amber-400"
            )}
          >
            {roleLabel}
          </Badge>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
