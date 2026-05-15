"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Wallet } from "lucide-react"
import { getWalletKit } from "@/lib/wallet/kit"
import { useWalletStore } from "@/store/wallet.store"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AuthClient() {
  const [loading, setLoading] = useState<"google" | "wallet" | null>(null)
  const { setWallet } = useWalletStore()
  const router = useRouter()

  async function handleGoogle() {
    setLoading("google")
    await signIn("google", { callbackUrl: "/onboarding" })
  }

  async function handleWallet() {
    setLoading("wallet")
    try {
      const kit = await getWalletKit()
      const { address } = await kit.authModal()

      // Upsert user by wallet
      const res = await fetch("/api/users/wallet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      })
      const json = await res.json()

      if (json.status === "error") {
        toast.error(json.message)
        return
      }

      setWallet(address, json.data.role ?? null)
      await signIn("credentials", {
        walletAddress: address,
        callbackUrl: json.data.onboardingComplete ? `/${json.data.role}` : "/onboarding",
      })
    } catch (err) {
      toast.error("Failed to connect wallet. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogle}
        disabled={loading !== null}
        variant="outline"
        className="w-full h-11 gap-3 border-border font-medium"
        size="lg"
      >
        <svg className="size-4.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {loading === "google" ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-foreground/40 font-medium">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        onClick={handleWallet}
        disabled={loading !== null}
        className="w-full h-11 gap-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        size="lg"
      >
        <Wallet size={18} />
        {loading === "wallet" ? "Opening wallet…" : "Connect Stellar Wallet"}
      </Button>
    </div>
  )
}
