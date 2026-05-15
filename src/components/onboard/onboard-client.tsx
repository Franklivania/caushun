"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/wallet/use-wallet"
import { useSetTrustline } from "@/hooks/escrow/use-set-trustline"
import { hasUsdcTrustline } from "@/lib/wallet/trustline-check"
import type { ApiResponse } from "@/lib/api-response"

type Step = "idle" | "accepting" | "trustline" | "done" | "error"

export function OnboardClient({
  token,
  roomId: _roomId,
  tenancyId: _tenancyId,
  landlordWallet: _landlordWallet,
  depositAmount: _depositAmount,
}: {
  token: string
  roomId: string
  tenancyId: string
  landlordWallet: string
  depositAmount: number
}) {
  const { address, connect } = useWallet()
  const trustline = useSetTrustline()
  const [step, setStep] = useState<Step>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function acceptInvite() {
    if (!address) {
      await connect("tenant")
      return
    }
    try {
      setStep("accepting")
      const res = await fetch(`/api/onboard/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantWallet: address }),
      })
      const json = (await res.json()) as ApiResponse<null>
      if (json.status === "error") {
        setErrorMsg(json.message)
        setStep("error")
        return
      }

      const hasTrustline = await hasUsdcTrustline(address)
      if (!hasTrustline) {
        setStep("trustline")
        await trustline.mutateAsync({ signer: address })
      }

      setStep("done")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong")
      setStep("error")
    }
  }

  const isPending = step === "accepting" || step === "trustline"

  const buttonLabel =
    step === "accepting"
      ? "Accepting invite…"
      : step === "trustline"
        ? "Setting up USDC trustline… (approve in wallet)"
        : !address
          ? "Connect wallet"
          : "Accept invite"

  return (
    <div className="mt-6 flex flex-col gap-3">
      {step !== "done" && (
        <Button onClick={acceptInvite} disabled={isPending}>
          {buttonLabel}
        </Button>
      )}
      {step === "done" && (
        <>
          <p className="text-sm text-green-600">
            You&apos;re in! Your landlord will deploy the escrow shortly.
          </p>
          <Button asChild>
            <Link href="/tenant/escrow">Go to your escrow</Link>
          </Button>
        </>
      )}
      {step === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
