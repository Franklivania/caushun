"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useWalletStore, type WalletRole } from "@/store/wallet.store"

export function WalletHydrator() {
  const { data: session } = useSession()
  const { address, setWallet } = useWalletStore()

  useEffect(() => {
    if (session?.user?.walletAddress && session?.user?.role && !address) {
      setWallet(session.user.walletAddress, session.user.role as WalletRole)
    }
  }, [session, address, setWallet])

  return null
}
