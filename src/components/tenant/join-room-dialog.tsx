"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DoorOpen } from "lucide-react"

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
      })
      const json = await res.json()
      if (json.status === "error") {
        toast.error(json.message)
        return
      }
      toast.success("Room joined!")
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <DoorOpen size={15} />
          Join a Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RM001-ABCDEF"
              className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && !loading && code.trim() && handleJoin()}
            />
            <p className="text-xs text-muted-foreground">
              Ask your landlord for the room code from their dashboard.
            </p>
          </div>
          <Button
            onClick={handleJoin}
            disabled={!code.trim() || loading}
            className="w-full"
          >
            {loading ? "Joining…" : "Join Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
