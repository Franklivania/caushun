import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShieldCheck, Landmark, UserCheck } from "lucide-react"

const steps = [
  {
    icon: Landmark,
    label: "Landlord deploys escrow",
    desc: "Smart contract holds the deposit — no landlord custody",
  },
  {
    icon: UserCheck,
    label: "Tenant funds securely",
    desc: "USDC locked on-chain via Stellar, both parties see it",
  },
  {
    icon: ShieldCheck,
    label: "Fair release at checkout",
    desc: "Platform releases based on photo evidence & agreement",
  },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-4 overflow-hidden bg-white">
      {/* Subtle gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/30 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        <Badge
          variant="outline"
          className="border-accent-foreground/20 bg-accent text-accent-foreground font-medium px-4 py-1.5 rounded-full text-sm"
        >
          Built on Stellar · Powered by Trustless Work
        </Badge>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
          Your caution fee.{" "}
          <span className="text-primary">Protected.</span>
        </h1>

        <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
          Nigeria&apos;s first on-chain rental security deposit platform.
          Landlords and tenants protected by smart contracts — no trust required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/auth">
            <Button
              size="lg"
              className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 text-base font-semibold"
            >
              Start as landlord <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-border gap-2 h-12 text-base font-semibold hover:bg-muted"
            >
              I&apos;m a tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Escrow flow card */}
      <div className="relative z-10 mt-20 w-full max-w-3xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={i}
                className="flex flex-col gap-3 p-6 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{step.label}</p>
                  <p className="text-sm text-foreground/55 mt-1 leading-snug">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-2 translate-x-1/2 -translate-y-1/2 z-10">
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
