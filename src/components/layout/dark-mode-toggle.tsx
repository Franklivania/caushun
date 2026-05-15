"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function DarkModeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("caushun-theme")
    const isDark = stored === null ? true : stored === "dark"
    setDark(isDark)
    document.getElementById("app-root")?.classList.toggle("dark", isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem("caushun-theme", next ? "dark" : "light")
    document.getElementById("app-root")?.classList.toggle("dark", next)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="w-9 h-9 rounded-full">
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </Button>
  )
}
