"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/lib/api-response"
import { humanizeEscrowError } from "@/lib/escrow/errors"

export function useVacateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenancyId: string) => {
      const res = await fetch(`/api/tenancies/${tenancyId}/vacate`, { method: "POST" })
      const json = (await res.json()) as ApiResponse<null>
      if (json.status === "error") throw new Error(humanizeEscrowError(json.message))
    },
    onSuccess: (_, tenancyId) => {
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
