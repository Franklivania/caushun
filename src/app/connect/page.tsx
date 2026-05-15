"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet/wallet-connect"

export default function ConnectPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-slate/60 bg-slate p-6">
        <h1 className="text-3xl font-semibold">Connect wallet</h1>
        <p className="mt-3 text-sm leading-6 text-ash">
          Connect Freighter to continue as a landlord, tenant, or admin.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <WalletConnect role="landlord" label="Connect as landlord" />
          <WalletConnect role="tenant" label="Connect as tenant" />
          <WalletConnect role="admin" label="Connect as admin" />
          <Button asChild variant="secondary">
            <Link href="/landlord">Landlord dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/tenant">Tenant dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
