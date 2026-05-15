"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Link2, Copy, Check } from "lucide-react"

export function InviteButton({
  roomId,
  existingToken,
}: {
  roomId: string
  existingToken?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const [inviteUrl, setInviteUrl] = useState<string | null>(
    existingToken ? `${baseUrl}/onboard/${existingToken}` : null
  )
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateInvite() {
    setPending(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/invite`, { method: "POST" })
      const json = await res.json()
      if (json.status === "error") throw new Error(json.message)
      setInviteUrl(json.data.inviteUrl)
      toast.success("Invite link generated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate invite")
    } finally {
      setPending(false)
    }
  }

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={generateInvite}
        disabled={pending}
        className="gap-2"
      >
        <Link2 size={14} />
        {pending ? "Generating…" : inviteUrl ? "Regenerate invite" : "Generate invite link"}
      </Button>
      {inviteUrl && (
        <Button size="sm" variant="ghost" onClick={copyUrl} className="gap-2">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      )}
    </div>
  )
}
