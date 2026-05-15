"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/wallet/use-wallet"
import type { WalletRole } from "@/store/wallet.store"

export function truncateWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletConnect({
  role = "tenant",
  compact = false,
  label,
}: {
  role?: WalletRole
  compact?: boolean
  label?: string
}) {
  const { address, connect, disconnect } = useWallet()
  const [pending, setPending] = useState(false)

  async function handleConnect() {
    setPending(true)
    try {
      await connect(role)
    } finally {
      setPending(false)
    }
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-ash">{truncateWallet(address)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearAuthCookies()
            disconnect()
          }}
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button variant={compact ? "ghost" : "secondary"} size={compact ? "sm" : "default"} onClick={handleConnect} disabled={pending}>
      {pending ? "Connecting..." : label ?? "Connect wallet"}
    </Button>
  )
}

function clearAuthCookies() {
  document.cookie = "caushun_wallet=; path=/; max-age=0; samesite=lax"
  document.cookie = "caushun_role=; path=/; max-age=0; samesite=lax"
}
