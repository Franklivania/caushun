"use client"

import { useEffect } from "react"

export function ApplyDarkMode() {
  useEffect(() => {
    const stored = localStorage.getItem("caushun-theme")
    const isDark = stored === null ? true : stored === "dark"
    document.documentElement.classList.toggle("dark", isDark)
    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [])
  return null
}
