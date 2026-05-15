"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/lib/api-response"
import type { SendTransactionResponse } from "@/lib/escrow/types"

export function useReleaseFunds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      tenancyId: string
      adminWallet: string
    }) => {
      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as ApiResponse<SendTransactionResponse>
      if (json.status === "error") throw new Error(json.message)
      return json.data
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
