"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useStartDispute, useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

export function useDisputeEscrow() {
  const queryClient = useQueryClient()
  const { startDispute } = useStartDispute()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      signerWallet: string
      tenancyId: string
      reason?: string
    }) => {
      const { unsignedTransaction } = await startDispute({
        contractId: input.contractId,
        signer: input.signerWallet,
      }, "single-release")
      if (!unsignedTransaction) throw new Error(humanizeEscrowError("No unsigned transaction returned"))

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
