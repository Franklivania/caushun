"use client"

import { useState, useEffect } from "react"
import { signOut, signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { getWalletKit } from "@/lib/wallet/kit"
import { Wallet, LogOut, Save, Link2, Unlink } from "lucide-react"

type UserData = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  fullName: string | null
  phone: string | null
  walletAddress: string | null
  role: "landlord" | "tenant" | "admin" | null
  onboardingComplete: boolean
}

interface SettingsClientProps {
  user: UserData
}

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export function SettingsClient({ user }: SettingsClientProps) {
  const [fullName, setFullName] = useState(user.fullName ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [wallet, setWallet] = useState(user.walletAddress ?? "")
  const [saving, setSaving] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("error") === "GoogleAccountInUse") {
      toast.error("That Google account is already linked to another Caushun account. Please use a different Google account.")
    }
  }, [searchParams])

  const roleLabel = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "—"

  const initials = (user.fullName ?? user.name ?? "U")[0].toUpperCase()

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName || undefined, phone: phone || undefined }),
      })
      const json = await res.json()
      if (json.status === "error") { toast.error(json.message); return }
      toast.success("Profile updated")
    } finally {
      setSaving(false)
    }
  }

  async function handleConnectWallet() {
    setConnectingWallet(true)
    try {
      const kit = await getWalletKit()
      const { address } = await kit.authModal()
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      })
      const json = await res.json()
      if (json.status === "error") { toast.error(json.message); return }
      setWallet(address)
      toast.success("Wallet linked successfully")
    } catch {
      toast.error("Wallet connection cancelled")
    } finally {
      setConnectingWallet(false)
    }
  }

  async function handleDisconnectWallet() {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: null }),
    })
    const json = await res.json()
    if (json.status === "error") { toast.error(json.message); return }
    setWallet("")
    toast.success("Wallet unlinked")
  }

  async function handleLinkGoogle() {
    setLinkingGoogle(true)
    try {
      await fetch("/api/users/link-intent", { method: "POST" })
      await signIn("google", { callbackUrl: "/settings" })
    } catch {
      toast.error("Could not start Google sign-in")
      setLinkingGoogle(false)
    }
  }

  return (
    <div className="max-w-xl space-y-8">

      {/* Profile section */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your public identity on Caushun.</p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.fullName || user.name || "No name set"}</p>
            <p className="text-sm text-muted-foreground">{user.email ?? "No email"}</p>
            <Badge variant="outline" className="mt-1 text-[10px] uppercase">
              {roleLabel}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Email is managed by your OAuth provider and cannot be changed here.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
          <Save size={15} />
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </section>

      <Separator />

      {/* Wallet section */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Stellar Wallet</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Link your Freighter wallet to sign escrow transactions.
          </p>
        </div>

        {wallet ? (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-primary" />
              <span className="text-sm font-medium text-primary">Wallet connected</span>
            </div>
            <p className="font-mono text-xs break-all text-muted-foreground">{wallet}</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={handleDisconnectWallet}
            >
              <Unlink size={14} />
              Disconnect wallet
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-3">
            <Wallet size={24} className="mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No wallet linked</p>
              <p className="text-xs text-muted-foreground mt-0.5">Connect Freighter to fund and sign escrow transactions.</p>
            </div>
            <Button
              onClick={handleConnectWallet}
              disabled={connectingWallet}
              className="gap-2"
              size="sm"
            >
              <Link2 size={14} />
              {connectingWallet ? "Opening wallet…" : "Connect Stellar Wallet"}
            </Button>
          </div>
        )}
      </section>

      <Separator />

      {/* Google account section */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Google Account</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.email ? "Your linked Google identity." : "Link Google to sign in with either method."}
          </p>
        </div>

        {user.email ? (
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <GoogleIcon className="size-4 shrink-0" />
            <span className="text-sm font-medium">Google connected</span>
            <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">{user.email}</span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-3">
            <GoogleIcon className="mx-auto size-6" />
            <div>
              <p className="text-sm font-medium">No Google account linked</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add Google so you can sign in without your wallet.</p>
            </div>
            <Button
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <GoogleIcon className="size-3.5" />
              {linkingGoogle ? "Redirecting…" : "Link Google Account"}
            </Button>
          </div>
        )}
      </section>

      <Separator />

      {/* Account section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your session.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </section>
    </div>
  )
}
