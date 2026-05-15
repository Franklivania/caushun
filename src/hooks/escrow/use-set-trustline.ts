"use client"

import { useMutation } from "@tanstack/react-query"
import type { ApiResponse } from "@/lib/api-response"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import type { SendTransactionResponse } from "@/lib/escrow/types"
import { signTransaction } from "@/lib/wallet/kit"

export function useSetTrustline() {
  return useMutation({
    mutationFn: async ({ signer }: { signer: string }) => {
      const res = await fetch("/api/escrow/trustline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer }),
      })
      const json = (await res.json()) as ApiResponse<{ unsignedTransaction: string | null }>
      if (json.status === "error") throw new Error(json.message)
      // null means trustline is already set — nothing to sign
      if (!json.data.unsignedTransaction) return

      const signedXdr = await signTransaction({
        unsignedTransaction: json.data.unsignedTransaction,
        address: signer,
      })

      return twPublicFetch<SendTransactionResponse>("/helper/send-transaction", {
        method: "POST",
        body: { signedXdr },
      })
    },
  })
}
