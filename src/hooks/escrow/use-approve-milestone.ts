"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useApproveMilestone as useSdkApproveMilestone,
  useSendTransaction,
} from "@trustless-work/escrow";
import { humanizeEscrowError } from "@/lib/escrow/errors";
import { signTransaction } from "@/lib/wallet/kit";

export function useApproveMilestone() {
  const queryClient = useQueryClient();
  const { approveMilestone } = useSdkApproveMilestone();
  const { sendTransaction } = useSendTransaction();

  return useMutation({
    mutationFn: async (input: {
      contractId: string;
      landlordWallet: string;
      tenancyId: string;
      onProgress?: (message: string) => void;
    }) => {
      const { unsignedTransaction } = await approveMilestone(
        {
          contractId: input.contractId,
          milestoneIndex: "0",
          approver: input.landlordWallet,
        },
        "single-release",
      );
      if (!unsignedTransaction)
        throw new Error(
          humanizeEscrowError("No unsigned transaction returned"),
        );

      input.onProgress?.("Sign in Freighter…");
      const signedXdr = await signTransaction({
        unsignedTransaction,
        address: input.landlordWallet,
      });

      input.onProgress?.("Releasing funds…");
      const result = await sendTransaction(signedXdr);

      input.onProgress?.("Saving…");
      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId: input.tenancyId, action: "approve" }),
      });

      return result;
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] });
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] });
    },
  });
}
