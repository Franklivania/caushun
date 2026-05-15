"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

interface DeployParams {
  landlordWallet: string
  tenantWallet: string
  roomId: string
  tenancyId: string
  onProgress?: (message: string) => void
}

export function useDeployEscrow() {
  const queryClient = useQueryClient()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async ({ landlordWallet, tenantWallet, roomId, tenancyId, onProgress }: DeployParams) => {
      const res = await fetch("/api/escrow/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landlordWallet, tenantWallet, roomId }),
      })
      const json = await res.json()
      if (json.status === "error") throw new Error(humanizeEscrowError(json.message))

      onProgress?.("Sign in Freighter…")
      const { unsignedTransaction } = json.data
      const signedXdr = await signTransaction({ unsignedTransaction, address: landlordWallet })

      onProgress?.("Submitting to Stellar…")
      const result = await sendTransaction(signedXdr)

      onProgress?.("Saving…")
      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId, action: "deploy", contractId: (result as { contractId?: string }).contractId }),
      })

      return result
    },
    onSuccess: (_, { tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
