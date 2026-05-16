"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/lib/api-response"
import { humanizeEscrowError } from "@/lib/escrow/errors"

export interface ResolveParams {
  contractId: string
  tenancyId: string
  disputeId?: string
  tenantWallet: string
  landlordWallet: string
  depositAmount: number
  platformFeePct: number
  tenantPct: number
  adminWallet: string
  resolutionNotes?: string
  forceResolve?: boolean
}

export function useResolveDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ResolveParams) => {
      const res = await fetch("/api/escrow/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      const json = (await res.json()) as ApiResponse<null>
      if (json.status === "error") throw new Error(humanizeEscrowError(json.message))
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
    },
  })
}
