"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useApproveMilestone as useSdkApproveMilestone,
  useSendTransaction,
} from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

function extractTwMessage(err: unknown): string {
  if (!err) return "Approval failed"
  // Axios error shape: err.response.data.message
  const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
  if (axiosMsg) return axiosMsg
  // Plain Error
  if (err instanceof Error) return err.message
  return String(err)
}

const ALREADY_APPROVED = "already been approved previously"

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
      // Step 1: get unsigned XDR — if already approved on-chain, skip signing entirely
      let skipOnChain = false
      let unsignedTransaction = ""

      try {
        const result = await approveMilestone(
          { contractId: input.contractId, milestoneIndex: "0", approver: input.landlordWallet },
          "single-release"
        )
        if (!result.unsignedTransaction) throw new Error("No unsigned transaction returned")
        unsignedTransaction = result.unsignedTransaction
      } catch (err) {
        const twMsg = extractTwMessage(err)
        if (twMsg.includes(ALREADY_APPROVED) || twMsg.includes("already approved")) {
          skipOnChain = true
          input.onProgress?.("Already approved — releasing funds…")
        } else {
          throw new Error(humanizeEscrowError(twMsg))
        }
      }

      // Step 2: sign + submit on-chain (skipped if already approved)
      if (!skipOnChain) {
        input.onProgress?.("Sign in Freighter…")
        const signedXdr = await signTransaction({
          unsignedTransaction,
          address: input.landlordWallet,
        })
        input.onProgress?.("Submitting approval…")
        await sendTransaction(signedXdr)
      }

      // Step 3: mark DB as "active" — idempotent, safe to repeat
      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId: input.tenancyId, action: "approve" }),
      })

      // Step 4: platform releases funds → escrowStatus → "resolved"
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
