"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/lib/api-response"

export function useVacateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenancyId: string) => {
      const res = await fetch(`/api/tenancies/${tenancyId}/vacate`, { method: "POST" })
      const json = (await res.json()) as ApiResponse<null>
      if (json.status === "error") throw new Error(json.message)
    },
    onSuccess: (_, tenancyId) => {
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
