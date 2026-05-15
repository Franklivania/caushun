"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useChangeMilestoneStatus, useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

export function useCheckout() {
  const queryClient = useQueryClient()
  const { changeMilestoneStatus } = useChangeMilestoneStatus()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      tenantWallet: string
      tenancyId: string
      moveOutPhotoUrls?: string[]
      tenantPct?: number
    }) => {
      const { unsignedTransaction } = await changeMilestoneStatus({
        contractId: input.contractId,
        milestoneIndex: "0",
        newStatus: "completed",
        serviceProvider: input.tenantWallet,
      }, "single-release")
      if (!unsignedTransaction) throw new Error(humanizeEscrowError("No unsigned transaction returned"))

      const signedXdr = await signTransaction({ unsignedTransaction, address: input.tenantWallet })
      const result = await sendTransaction(signedXdr)

      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tenancyId: input.tenancyId,
            action: "checkout",
            moveOutPhotoUrls: input.moveOutPhotoUrls,
            tenantPct: input.tenantPct,
          }),
      })

      return result
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
