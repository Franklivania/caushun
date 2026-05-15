"use client"

import { create } from "zustand"

export type WalletRole = "landlord" | "tenant" | "admin"

interface WalletState {
  address: string | null
  role: WalletRole | null
  setWallet: (address: string, role: WalletRole) => void
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  role: null,
  setWallet: (address, role) => set({ address, role }),
  disconnect: () => set({ address: null, role: null }),
}))
