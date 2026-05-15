"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/sidebar-nav"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { DarkModeToggle } from "@/components/layout/dark-mode-toggle"
import { UserMenu } from "@/components/auth/user-menu"
import { WalletHydrator } from "@/components/layout/wallet-hydrator"
import { Separator } from "@/components/ui/separator"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider>
      <WalletHydrator />
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar — hidden on mobile via shadcn sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Top header */}
          <header className="flex items-center h-14 px-4 border-b border-border gap-3 shrink-0 bg-background">
            <SidebarTrigger className="hidden md:flex -ml-1" />
            <Separator orientation="vertical" className="hidden md:block h-5" />
            <div className="flex-1" />
            <DarkModeToggle />
            <UserMenu />
          </header>

          {/* Scrollable page content — extra bottom padding for mobile tab bar */}
          <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 bg-background">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </SidebarProvider>
    </TooltipProvider>
  )
}
