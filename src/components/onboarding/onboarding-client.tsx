"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Wallet, UserCircle, Building, User } from "lucide-react"
import { getWalletKit } from "@/lib/wallet/kit"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Step = "wallet" | "role" | "profile"

const STEPS: Step[] = ["wallet", "role", "profile"]

interface Props {
  userId: string
  defaultName: string
  defaultImage: string
  hasWallet: boolean
  hasRole: boolean
}

export function OnboardingClient({ userId, defaultName, defaultImage, hasWallet, hasRole }: Props) {
  const router = useRouter()
  const initialStep: Step = hasWallet ? (hasRole ? "profile" : "role") : "wallet"
  const [step, setStep] = useState<Step>(initialStep)
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null)
  const [fullName, setFullName] = useState(defaultName)
  const [phone, setPhone] = useState("")
  const [walletConnected, setWalletConnected] = useState(hasWallet)
  const [loading, setLoading] = useState(false)

  const currentIndex = STEPS.indexOf(step)

  async function connectWallet() {
    setLoading(true)
    try {
      const kit = await getWalletKit()
      const { address } = await kit.authModal()
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      })
      if ((await res.json()).status === "success") {
        setWalletConnected(true)
        toast.success("Wallet connected!")
        setStep("role")
      }
    } catch {
      toast.error("Wallet connection failed.")
    } finally {
      setLoading(false)
    }
  }

  async function selectRole(r: "landlord" | "tenant") {
    setRole(r)
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    })
    if ((await res.json()).status === "success") setStep("profile")
  }

  async function completeProfile() {
    setLoading(true)
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, onboardingComplete: true }),
    })
    const json = await res.json()
    if (json.status === "success") {
      toast.success("Account ready!")
      router.push(role === "landlord" ? "/landlord" : "/tenant")
    } else {
      toast.error(json.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Stepper header */}
      <div className="flex border-b border-border">
        {STEPS.map((s, i) => {
          const done = i < currentIndex
          const active = s === step
          return (
            <div
              key={s}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold transition-colors",
                active ? "text-primary border-b-2 border-primary" : done ? "text-accent-foreground" : "text-foreground/30"
              )}
            >
              {done
                ? <CheckCircle2 size={16} className="text-accent-foreground" />
                : <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                    active ? "bg-primary text-white" : "bg-muted text-foreground/40"
                  )}>{i + 1}</span>
              }
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="p-8 space-y-6 min-h-[320px] flex flex-col justify-between">
        {step === "wallet" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Connect your wallet</h2>
              <p className="text-sm text-foreground/55">
                Your Stellar wallet signs escrow transactions. Connect Freighter or Albedo.
              </p>
            </div>
            <Button
              onClick={connectWallet}
              disabled={loading || walletConnected}
              className="w-full h-11 gap-2 bg-primary text-primary-foreground"
            >
              <Wallet size={18} />
              {walletConnected ? "Wallet connected ✓" : loading ? "Opening wallet…" : "Connect Stellar Wallet"}
            </Button>
            {walletConnected && (
              <Button variant="outline" className="w-full" onClick={() => setStep("role")}>
                Continue
              </Button>
            )}
          </div>
        )}

        {step === "role" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">How will you use Caushun?</h2>
              <p className="text-sm text-foreground/55">Choose your primary role — you can always create another account.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => selectRole("landlord")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-primary",
                  role === "landlord" ? "border-primary bg-accent/30" : "border-border"
                )}
              >
                <Building size={28} className="text-primary" />
                <span className="font-semibold text-sm text-foreground">Landlord</span>
                <span className="text-xs text-foreground/50 text-center leading-snug">I own properties and want to protect deposits</span>
              </button>
              <button
                onClick={() => selectRole("tenant")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-primary",
                  role === "tenant" ? "border-primary bg-accent/30" : "border-border"
                )}
              >
                <User size={28} className="text-primary" />
                <span className="font-semibold text-sm text-foreground">Tenant</span>
                <span className="text-xs text-foreground/50 text-center leading-snug">I rent a property and want my deposit secured</span>
              </button>
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={defaultImage} />
                <AvatarFallback className="bg-accent text-accent-foreground font-bold text-lg">
                  {fullName?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-foreground">Complete your profile</h2>
                <p className="text-sm text-foreground/55">Used for communications and your dashboard</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chibuzo Franklin"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">Phone number <span className="text-foreground/40 font-normal">(optional)</span></Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="h-11"
                />
              </div>
            </div>
            <Button
              onClick={completeProfile}
              disabled={loading || !fullName.trim()}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold"
            >
              {loading ? "Saving…" : "Finish setup"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
