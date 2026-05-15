import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatCard({ label, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {trend && (
          <p className={cn("text-xs mt-1.5 font-medium", trendUp ? "text-emerald-400" : "text-muted-foreground")}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
