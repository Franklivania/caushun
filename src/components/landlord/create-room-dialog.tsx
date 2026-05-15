"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function CreateRoomDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          roomNumber: form.get("roomNumber"),
          depositAmount: Number(form.get("depositAmount")),
        }),
      })
      const json = await res.json()
      if (json.status === "error") {
        toast.error(json.message)
      } else {
        toast.success("Room created")
        setOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={15} />
          Add room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="roomNumber">Room number / label</Label>
            <Input id="roomNumber" name="roomNumber" placeholder="e.g. A1, Suite 3, Room 101" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="depositAmount">Deposit amount (USDC)</Label>
            <Input
              id="depositAmount"
              name="depositAmount"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Add room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
