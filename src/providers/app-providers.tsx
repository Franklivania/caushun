"use client"

import { QueryProvider } from "@/providers/query-provider"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { TrustlessWorkConfig, development } from "@trustless-work/escrow"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <TrustlessWorkConfig
          baseURL={development}
          apiKey={process.env.NEXT_PUBLIC_TW_API_KEY ?? ""}
        >
          {children}
        </TrustlessWorkConfig>
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </SessionProvider>
  )
}
