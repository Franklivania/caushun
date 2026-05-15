"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Building2, BedDouble, Users, BarChart2, User, Wallet, AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

const landlordTabs = [
  { label: "Home", href: "/landlord", icon: Home, exact: true },
  { label: "Properties", href: "/landlord/properties", icon: Building2 },
  { label: "Rooms", href: "/landlord/rooms", icon: BedDouble },
  { label: "Tenants", href: "/landlord/tenants", icon: Users },
]

const tenantTabs = [
  { label: "Home", href: "/tenant", icon: Home, exact: true },
  { label: "Room", href: "/tenant/room", icon: BedDouble },
  { label: "Escrow", href: "/tenant/escrow", icon: Wallet },
]

const adminTabs = [
  { label: "Home", href: "/admin", icon: Home, exact: true },
  { label: "Users", href: "/admin/users", icon: User },
  { label: "Tenancies", href: "/admin/tenancies", icon: FileText },
  { label: "Disputes", href: "/admin/disputes", icon: AlertCircle },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
]

export function MobileTabBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role
  const tabs = role === "landlord" ? landlordTabs : role === "tenant" ? tenantTabs : adminTabs

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border safe-b">
      <div className="flex items-center justify-around py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[52px]",
                active ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "")}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
