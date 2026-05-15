"use client"

import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, UserCircle } from "lucide-react"

export function UserMenu() {
  const { data: session } = useSession()
  if (!session?.user) return null

  const { name, image, role, walletAddress, fullName } = session.user
  const display = fullName || name || "User"
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pr-2 hover:bg-muted transition-colors outline-none">
          <Avatar className="w-8 h-8">
            <AvatarImage src={image ?? ""} />
            <AvatarFallback className="text-xs font-bold bg-accent text-accent-foreground">
              {display[0]}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium">{display}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{display}</span>
            <Badge variant="outline" className="text-[10px] uppercase">{roleLabel}</Badge>
          </div>
          {walletAddress && (
            <span className="text-xs text-muted-foreground font-mono">
              {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 cursor-pointer">
          <UserCircle size={15} />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 text-destructive cursor-pointer focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={15} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
