"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PLATFORM_FEE_PCT } from "@/lib/constants"
import { useResolveDispute } from "@/hooks/escrow/use-resolve-dispute"
import { toast } from "sonner"

export function ResolveDisputeForm({
  contractId,
  tenancyId,
  disputeId,
  tenantWallet,
  landlordWallet,
  depositAmount,
  adminWallet,
}: {
  contractId: string
  tenancyId: string
  disputeId: string
  tenantWallet: string
  landlordWallet: string
  depositAmount: number
  adminWallet: string
}) {
  const [tenantPct, setTenantPct] = useState(100)
  const resolve = useResolveDispute()

  const net = depositAmount * (1 - PLATFORM_FEE_PCT / 100)
  const tenantAmount = (net * tenantPct) / 100
  const landlordAmount = net - tenantAmount

  function handleResolve() {
    resolve.mutate(
      {
        contractId,
        tenancyId,
        disputeId,
        tenantWallet,
        landlordWallet,
        depositAmount,
        platformFeePct: PLATFORM_FEE_PCT,
        tenantPct,
        adminWallet,
      },
      {
        onSuccess: () => toast.success("Dispute resolved"),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label className="text-sm font-medium">
            Tenant refund: <span className="text-primary font-bold">{tenantPct}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={tenantPct}
            onChange={(e) => setTenantPct(Number(e.target.value))}
            aria-label="Tenant refund percentage"
            className="mt-3 w-full h-2 accent-primary rounded-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Tenant receives</p>
            <p className="text-xl font-bold text-emerald-400">{tenantAmount.toFixed(2)} USDC</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Landlord receives</p>
            <p className="text-xl font-bold">{landlordAmount.toFixed(2)} USDC</p>
          </div>
          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Platform fee ({PLATFORM_FEE_PCT}%) deducted — net pool: {net.toFixed(2)} USDC
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={resolve.isPending}
          onClick={handleResolve}
        >
          {resolve.isPending ? "Resolving…" : "Resolve dispute"}
        </Button>
      </CardContent>
    </Card>
  )
}
