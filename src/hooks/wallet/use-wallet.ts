"use client"

import { getWalletKit } from "@/lib/wallet/kit"
import { useWalletStore, type WalletRole } from "@/store/wallet.store"

export function useWallet() {
  const { address, role, setWallet, disconnect } = useWalletStore()

  async function connect(nextRole: WalletRole = "tenant") {
    const kit = await getWalletKit()
    const { address: selectedAddress } = await kit.authModal()
    setWallet(selectedAddress, nextRole)
    document.cookie = `caushun_wallet=${selectedAddress}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    document.cookie = `caushun_role=${nextRole}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  }

  return { address, role, connect, disconnect, isConnected: !!address }
}
