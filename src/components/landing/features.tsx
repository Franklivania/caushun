import { Home, Users, ArrowDownToLine, FileCheck, Camera, ShieldCheck, Clock, ArrowLeftRight } from "lucide-react"

const landlordFeatures = [
  {
    icon: Home,
    title: "Multi-property management",
    desc: "Organise all your properties and rooms in one dashboard. One escrow per room, always.",
  },
  {
    icon: FileCheck,
    title: "Invite-link onboarding",
    desc: "Generate a secure invite link for each room. Tenant onboards themselves — no paperwork.",
  },
  {
    icon: Camera,
    title: "Move-in photo records",
    desc: "Both parties upload photos at move-in. Timestamped evidence that protects landlords fairly.",
  },
  {
    icon: Clock,
    title: "5-day checkout window",
    desc: "Approve or dispute within 5 days of checkout. If no action, funds are released automatically.",
  },
]

const tenantFeatures = [
  {
    icon: ShieldCheck,
    title: "Your money, on-chain",
    desc: "Deposit goes directly to a smart contract — not the landlord's bank account. See it any time.",
  },
  {
    icon: ArrowDownToLine,
    title: "Dispute protection",
    desc: "If you disagree with deductions, raise a dispute. A neutral platform mediates using photo evidence.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transparent audit trail",
    desc: "Every action is recorded on Stellar. View your escrow on the Trustless Work explorer at any time.",
  },
  {
    icon: Users,
    title: "Proposed split control",
    desc: "You propose how the deposit should be split at checkout. Landlord can agree or counter.",
  },
]

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  desc: string
}) {
  return (
    <div className="flex gap-4 p-5 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={17} className="text-accent-foreground" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-sm text-foreground/55 mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-[#F9FAFB]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-sm font-semibold text-accent-foreground uppercase tracking-widest">
            Features
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Built for both sides
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Landlord column */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-1">
            <div className="mb-4 px-5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                For landlords
              </span>
              <h3 className="text-xl font-bold text-foreground mt-1">
                Protect your property. Attract better tenants.
              </h3>
            </div>
            {landlordFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>

          {/* Tenant column */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-1">
            <div className="mb-4 px-5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                For tenants
              </span>
              <h3 className="text-xl font-bold text-foreground mt-1">
                Know your deposit is safe — always.
              </h3>
            </div>
            {tenantFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
