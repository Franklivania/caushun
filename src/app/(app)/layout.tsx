import { AppShell } from "@/components/layout/app-shell"
import { ApplyDarkMode } from "@/components/layout/apply-dark-mode"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div id="app-root" className="dark text-foreground bg-background min-h-screen">
      <ApplyDarkMode />
      <AppShell>{children}</AppShell>
    </div>
  )
}
