"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"
import { useDeployEscrow } from "@/hooks/escrow/use-deploy-escrow"
import { useWallet } from "@/hooks/wallet/use-wallet"
import { toast } from "sonner"

interface DeployEscrowButtonProps {
  roomId: string
  tenancyId: string
  tenantWallet: string
  className?: string
}

export function DeployEscrowButton({ roomId, tenancyId, tenantWallet, className }: DeployEscrowButtonProps) {
  const router = useRouter()
  const { address, connect, isConnected } = useWallet()
  const { mutate: deploy, isPending } = useDeployEscrow()

  async function handleDeploy() {
    const walletAddress = address ?? await connect("landlord")
    const id = toast.loading("Building transaction…")
    deploy(
      {
        landlordWallet: walletAddress,
        tenantWallet,
        roomId,
        tenancyId,
        onProgress: (msg) => toast.loading(msg, { id }),
      },
      {
        onSuccess: () => {
          toast.success("Escrow deployed — tenant can now fund", { id })
          router.refresh()
        },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  return (
    <Button size="sm" onClick={handleDeploy} disabled={isPending} className={`gap-2${className ? ` ${className}` : ""}`}>
      <Rocket size={14} />
      {isPending ? "Deploying…" : !isConnected ? "Connect & deploy escrow" : "Deploy escrow"}
    </Button>
  )
}
