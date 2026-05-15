"use client"

import { create } from "zustand"

interface TenancyState {
  activeTenancyId: string | null
  setActiveTenancyId: (tenancyId: string | null) => void
}

export const useTenancyStore = create<TenancyState>((set) => ({
  activeTenancyId: null,
  setActiveTenancyId: (activeTenancyId) => set({ activeTenancyId }),
}))
