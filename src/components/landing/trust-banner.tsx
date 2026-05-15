import { Lock, Eye, Zap, ShieldCheck } from "lucide-react"

const pillars = [
  {
    icon: Lock,
    title: "Non-custodial",
    desc: "We never hold your money. Funds are locked in a Stellar smart contract that only releases under agreed conditions.",
  },
  {
    icon: Eye,
    title: "Fully transparent",
    desc: "Every escrow is publicly verifiable on the Stellar blockchain. Nothing hidden, nothing editable after the fact.",
  },
  {
    icon: Zap,
    title: "Instant settlement",
    desc: "Stellar confirms transactions in 3–5 seconds. Once approved, your funds arrive — no waiting, no bank delays.",
  },
  {
    icon: ShieldCheck,
    title: "Photo-backed disputes",
    desc: "Disputes are resolved using timestamped photo evidence uploaded by both parties at move-in and move-out.",
  },
]

export function TrustBanner() {
  return (
    <section id="trust" className="py-24 px-4 bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest">
            Why trust Caushun
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            The landlord no longer holds the power.
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Smart contracts enforce the rules so neither party can act unfairly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Icon size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-bold text-base">{pillar.title}</p>
                  <p className="text-sm text-primary-foreground/60 mt-2 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
