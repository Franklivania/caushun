"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useFundEscrow as useSdkFundEscrow, useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

export function useFundEscrow() {
  const queryClient = useQueryClient()
  const { fundEscrow } = useSdkFundEscrow()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async (input: {
      contractId: string
      tenantWallet: string
      amount: number
      tenancyId: string
    }) => {
      const { unsignedTransaction } = await fundEscrow({
        contractId: input.contractId,
        amount: input.amount,
        signer: input.tenantWallet,
      }, "single-release")
      if (!unsignedTransaction) throw new Error(humanizeEscrowError("No unsigned transaction returned"))

      const signedXdr = await signTransaction({ unsignedTransaction, address: input.tenantWallet })
      const result = await sendTransaction(signedXdr)

      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId: input.tenancyId, action: "fund" }),
      })

      return result
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
