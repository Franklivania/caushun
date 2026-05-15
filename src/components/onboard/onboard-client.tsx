"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDeployEscrow } from "@/hooks/escrow/use-deploy-escrow"
import { useFundEscrow } from "@/hooks/escrow/use-fund-escrow"
import { useSetTrustline } from "@/hooks/escrow/use-set-trustline"
import { useWallet } from "@/hooks/wallet/use-wallet"

export function OnboardClient({
  token,
  roomId,
  tenancyId,
  landlordWallet,
  depositAmount,
}: {
  token: string
  roomId: string
  tenancyId: string
  landlordWallet: string
  depositAmount: number
}) {
  const { address, connect } = useWallet()
  const [message, setMessage] = useState<string | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)
  const trustline = useSetTrustline()
  const deploy = useDeployEscrow()
  const fund = useFundEscrow()

  async function acceptInvite() {
    if (!address) {
      await connect("tenant")
      return
    }
    const res = await fetch(`/api/onboard/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantWallet: address }),
    })
    const json = await res.json()
    if (json.status === "error") {
      setMessage(json.message)
      return
    }
    setMessage("Invite accepted. Ask landlord to sign deploy, then fund escrow.")
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {!address && <Button onClick={() => connect("tenant")}>Connect tenant wallet</Button>}
      <Button onClick={acceptInvite}>Accept invite</Button>
      <Button disabled={!address || trustline.isPending} onClick={() => address && trustline.mutate({ signer: address })}>
        {trustline.isPending ? "Setting trustline..." : "Set USDC trustline"}
      </Button>
      <Button
        disabled={!address || deploy.isPending}
        onClick={() =>
          address &&
          deploy.mutate(
            { landlordWallet, tenantWallet: address, roomId, tenancyId },
            { onSuccess: (data) => setContractId((data as { contractId?: string }).contractId ?? null) }
          )
        }
      >
        {deploy.isPending ? "Deploying..." : "Deploy escrow"}
      </Button>
      <Button
        disabled={!address || !contractId || fund.isPending}
        onClick={() =>
          address &&
          contractId &&
          fund.mutate({ contractId, tenantWallet: address, amount: depositAmount, tenancyId })
        }
      >
        {fund.isPending ? "Funding..." : "Fund escrow"}
      </Button>
      {(message || deploy.error || fund.error || trustline.error) && (
        <p className="text-sm text-slate">
          {message ?? deploy.error?.message ?? fund.error?.message ?? trustline.error?.message}
        </p>
      )}
    </div>
  )
}
