"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useInitializeEscrow, useSendTransaction } from "@trustless-work/escrow"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { signTransaction } from "@/lib/wallet/kit"

interface DeployParams {
  landlordWallet: string
  tenantWallet: string
  roomId: string
  tenancyId: string
}

export function useDeployEscrow() {
  const queryClient = useQueryClient()
  const { deployEscrow } = useInitializeEscrow()
  const { sendTransaction } = useSendTransaction()

  return useMutation({
    mutationFn: async ({ landlordWallet, tenantWallet, roomId, tenancyId }: DeployParams) => {
      // Fetch deploy payload from server (builds the full TW payload with room data)
      const res = await fetch("/api/escrow/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landlordWallet, tenantWallet, roomId, payloadOnly: true }),
      })
      const json = await res.json()
      if (json.status === "error") throw new Error(humanizeEscrowError(json.message))

      const { unsignedTransaction } = await deployEscrow(json.data.payload, "single-release")
      if (!unsignedTransaction) throw new Error("No unsigned transaction returned")

      const signedXdr = await signTransaction({ unsignedTransaction, address: landlordWallet })
      const result = await sendTransaction(signedXdr)

      // Record contractId + update DB + send email
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
