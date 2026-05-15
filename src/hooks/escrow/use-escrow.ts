"use client"

import { useQuery } from "@tanstack/react-query"
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow"
import type { EscrowState } from "@/lib/escrow/types"

export function useEscrow(contractId: string | undefined) {
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds()

  return useQuery({
    queryKey: ["escrow", contractId],
    queryFn: async () => {
      const list = await getEscrowByContractIds({ contractIds: [contractId!] })
      return (list[0] as unknown as EscrowState) ?? null
    },
    enabled: !!contractId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function escrowViewerUrl(contractId: string): string {
  return `${process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL}/${contractId}`
}
