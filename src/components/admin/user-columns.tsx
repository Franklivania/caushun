"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface UserRow {
  id: string
  name: string | null
  email: string | null
  walletAddress: string | null
  role: "landlord" | "tenant" | "admin" | null
  onboardingComplete: boolean
  createdAt: Date
}

function DeleteUserAction({ id }: { id: string }) {
  const router = useRouter()
  async function handleDelete() {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (json.status === "error") {
      toast.error(json.message)
    } else {
      toast.success("User deleted")
      router.refresh()
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive">
          <Trash2 size={14} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the user and all associated data. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.original.email ?? "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "walletAddress",
    header: "Wallet",
    cell: ({ getValue }) => {
      const addr = getValue<string | null>()
      return addr ? (
        <span className="font-mono text-xs">{addr.slice(0, 8)}…{addr.slice(-4)}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => {
      const role = getValue<string | null>()
      if (!role) return <span className="text-muted-foreground text-xs">—</span>
      return (
        <Badge variant="outline" className="text-[11px] capitalize">
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "onboardingComplete",
    header: "Onboarded",
    cell: ({ getValue }) => (
      <span className={getValue<boolean>() ? "text-emerald-400 text-xs" : "text-muted-foreground text-xs"}>
        {getValue<boolean>() ? "Yes" : "No"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(getValue<Date>()).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DeleteUserAction id={row.original.id} />,
  },
]
