import { OnboardingClient } from "@/components/onboarding/onboarding-client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = { title: "Set up your account — Caushun" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth")
  if (session.user.onboardingComplete) {
    redirect(session.user.role === "landlord" ? "/landlord" : "/tenant")
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 space-y-1">
          <span className="text-2xl font-black tracking-tight text-primary">Caushun</span>
          <p className="text-sm text-foreground/50">Let&apos;s set up your account</p>
        </div>
        <OnboardingClient
          userId={session.user.id!}
          defaultName={session.user.name ?? ""}
          defaultImage={session.user.image ?? ""}
          hasWallet={!!session.user.walletAddress}
          hasRole={!!session.user.role}
        />
      </div>
    </div>
  )
}
