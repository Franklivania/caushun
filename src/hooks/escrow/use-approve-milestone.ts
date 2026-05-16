"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useApproveMilestone as useSdkApproveMilestone,
  useSendTransaction,
} from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

export function useApproveMilestone() {
  const queryClient = useQueryClient()
  const { approveMilestone } = useSdkApproveMilestone()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      landlordWallet: string
      tenancyId: string
      onProgress?: (message: string) => void
    }) => {
      // Step 1: get unsigned XDR from TW — wrap SDK errors so they're human-readable
      let unsignedTransaction: string
      try {
        const result = await approveMilestone(
          { contractId: input.contractId, milestoneIndex: "0", approver: input.landlordWallet },
          "single-release"
        )
        if (!result.unsignedTransaction) throw new Error("No unsigned transaction returned")
        unsignedTransaction = result.unsignedTransaction
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Approval failed"
        throw new Error(humanizeEscrowError(msg))
      }

      // Step 2: sign + submit on-chain
      input.onProgress?.("Sign in Freighter…")
      const signedXdr = await signTransaction({
        unsignedTransaction,
        address: input.landlordWallet,
      })
      input.onProgress?.("Submitting approval…")
      await sendTransaction(signedXdr)

      // Step 3: immediately mark as "active" in DB — prevents double-approve even if release fails
      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId: input.tenancyId, action: "approve" }),
      })

      // Step 4: platform wallet releases funds → escrowStatus → "resolved"
      input.onProgress?.("Releasing funds…")
      const releaseRes = await fetch("/api/escrow/complete-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: input.contractId, tenancyId: input.tenancyId }),
      })
      const releaseJson = await releaseRes.json()
      if (releaseJson.status === "error") throw new Error(humanizeEscrowError(releaseJson.message))
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
