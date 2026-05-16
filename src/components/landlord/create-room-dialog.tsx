"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import type { ApiResponse } from "@/lib/api-response"

interface Property {
  id: string
  name: string
  address: string
}

export function CreateRoomDialog({ propertyId }: { propertyId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const router = useRouter()

  const propertiesQuery = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await fetch("/api/properties")
      const json = (await res.json()) as ApiResponse<Property[]>

      if (json.status === "error") {
        throw new Error(json.message)
      }

      return json.data
    },
    enabled: open && !propertyId,
  })

  useEffect(() => {
    if (propertiesQuery.isError) {
      toast.error("Failed to load properties")
    }
  }, [propertiesQuery.isError])

  const properties = propertiesQuery.data ?? []
  const propertiesLoading = propertiesQuery.isLoading || propertiesQuery.isFetching
  const resolvedPropertyId = propertyId ?? selectedPropertyId

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setSelectedPropertyId("")
  }

  function closeDialog() {
    handleOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resolvedPropertyId) return
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: resolvedPropertyId,
          roomNumber: form.get("roomNumber"),
          depositAmount: Number(form.get("depositAmount")),
        }),
      })
      const json = await res.json()
      if (json.status === "error") {
        toast.error(json.message)
      } else {
        toast.success("Room created")
        closeDialog()
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {!propertyId && (
            <div className="w-full space-y-1.5">
              <Label>Property</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
                disabled={propertiesLoading}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={propertiesLoading ? "Loading properties…" : "Select a property"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.address}
                    </SelectItem>
                  ))}
                  {!propertiesLoading && properties.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No properties yet. Create a property first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="roomNumber">Room number / label</Label>
            <Input
              id="roomNumber"
              name="roomNumber"
              placeholder="e.g. A1, Suite 3, Room 101"
              required
            />
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
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !resolvedPropertyId}>
              {loading ? "Creating…" : "Add room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
