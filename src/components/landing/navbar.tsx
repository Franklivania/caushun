"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Why trust us", href: "#trust" },
  { label: "FAQ", href: "#faq" },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4">
      {/* ── Desktop pill nav ─────────────────────────────────── */}
      <nav
        className={`
          hidden md:flex items-center gap-3 mx-auto max-w-fit
          px-4 py-2 rounded-full border transition-all duration-300
          ${scrolled
            ? "bg-white/90 backdrop-blur-md border-border shadow-sm"
            : "bg-white/70 backdrop-blur-sm border-border/50"
          }
        `}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-3">
          <span className="text-lg font-bold tracking-tight text-primary">
            Caushun
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-border" />

        {/* Nav links */}
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          >
            {link.label}
          </Link>
        ))}

        {/* Divider */}
        <div className="w-px h-4 bg-border" />

        {/* CTA */}
        <Link href="/auth">
          <Button size="sm" className="rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90">
            Get started
          </Button>
        </Link>
      </nav>

      {/* ── Mobile nav — logo left, hamburger right ──────────── */}
      <nav className="md:hidden flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-primary">
            Caushun
          </span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-border bg-white/80 backdrop-blur-sm">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-white">
            <div className="flex flex-col gap-1 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 px-2">
                <Link href="/auth" onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-full bg-primary text-primary-foreground">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
