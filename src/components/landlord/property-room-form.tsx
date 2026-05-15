"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CreatedProperty {
  id: string
  name: string
}

export function PropertyRoomForm({ landlordWallet }: { landlordWallet: string }) {
  const [property, setProperty] = useState<CreatedProperty | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function createProperty(formData: FormData) {
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlordWallet,
          name: formData.get("name"),
          address: formData.get("address"),
          state: formData.get("state"),
        }),
      })
      const json = await res.json()
      if (json.status === "error") throw new Error(json.message)
      setProperty(json.data)
      setMessage("Property created. Add a room next.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Property create failed")
    } finally {
      setPending(false)
    }
  }

  async function createRoom(formData: FormData) {
    if (!property) return
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlordWallet,
          propertyId: property.id,
          roomNumber: formData.get("roomNumber"),
          uniqueCode: formData.get("uniqueCode"),
          depositAmount: Number(formData.get("depositAmount")),
        }),
      })
      const json = await res.json()
      if (json.status === "error") throw new Error(json.message)
      setMessage("Room created. Generate its invite from the dashboard.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Room create failed")
    } finally {
      setPending(false)
    }
  }

  const inputClass = "w-full rounded-md border border-ash bg-white px-4 py-2.5 text-sm text-near-black outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form action={createProperty} className="rounded-lg border border-slate/60 bg-slate p-5">
        <h2 className="text-xl font-medium">Add property</h2>
        <div className="mt-4 space-y-3">
          <input className={inputClass} name="name" placeholder="Property name" required />
          <input className={inputClass} name="address" placeholder="Address" required />
          <input className={inputClass} name="state" placeholder="State" required />
        </div>
        <Button className="mt-4" disabled={pending}>
          Save property
        </Button>
      </form>

      <form action={createRoom} className="rounded-lg border border-slate/60 bg-slate p-5">
        <h2 className="text-xl font-medium">Add room</h2>
        <div className="mt-4 space-y-3">
          <input className={inputClass} name="roomNumber" placeholder="Room number" required />
          <input className={inputClass} name="uniqueCode" placeholder="NSK-001-R02" required />
          <input className={inputClass} name="depositAmount" placeholder="Deposit in USDC" type="number" min="1" required />
        </div>
        <Button className="mt-4" disabled={pending || !property}>
          Save room
        </Button>
      </form>
      {message && <p className="md:col-span-2 text-sm text-mint">{message}</p>}
    </div>
  )
}
