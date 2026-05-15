"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"
import type { ApiResponse } from "@/lib/api-response"

export function useDisputeEscrow() {
  const queryClient = useQueryClient()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      signerWallet: string
      tenancyId: string
      reason?: string
    }) => {
      // Use the API route so milestoneIndex: "0" is included and dispute record is created
      const res = await fetch("/api/escrow/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: input.contractId,
          signerWallet: input.signerWallet,
          tenancyId: input.tenancyId,
          reason: input.reason ?? "Dispute raised via platform",
        }),
      })
      const json = (await res.json()) as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") throw new Error(humanizeEscrowError(json.message))

      const { unsignedTransaction } = json.data
      const signedXdr = await signTransaction({ unsignedTransaction, address: input.signerWallet })
      const result = await sendTransaction(signedXdr)

      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId: input.tenancyId, action: "dispute" }),
      })

      return result
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
    },
  })
}
