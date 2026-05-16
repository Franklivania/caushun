"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RotateCw } from "lucide-react"

export function RefreshButton() {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  function handleRefresh() {
    setSpinning(true)
    router.refresh()
    setTimeout(() => setSpinning(false), 800)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
      <RotateCw size={14} className={spinning ? "animate-spin" : ""} />
      Refresh
    </Button>
  )
}
