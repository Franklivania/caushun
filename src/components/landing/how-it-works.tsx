const steps = [
  {
    number: "01",
    title: "Landlord creates an escrow",
    description:
      "Sign in, add your property and room, then deploy a Stellar smart contract. The escrow address is unique to this tenancy.",
    tag: "For landlords",
  },
  {
    number: "02",
    title: "Tenant funds the deposit",
    description:
      "Tenant receives an invite link, connects their Stellar wallet, and sends USDC directly to the escrow — no middleman.",
    tag: "For tenants",
  },
  {
    number: "03",
    title: "Move-in photos documented",
    description:
      "Both parties upload move-in photos to the platform. These are timestamped and immutable — your evidence if anything goes wrong.",
    tag: "Both parties",
  },
  {
    number: "04",
    title: "Checkout & fair release",
    description:
      "Tenant requests checkout with move-out photos. Landlord approves the split, or raises a dispute. Caushun mediates and releases funds.",
    tag: "End of tenancy",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-sm font-semibold text-accent-foreground uppercase tracking-widest">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Four steps. Zero trust required.
          </h2>
          <p className="text-foreground/60 text-lg max-w-xl mx-auto">
            The entire deposit lifecycle happens on-chain. Transparent, auditable, and fair for both sides.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative p-8 rounded-2xl border border-border bg-white hover:border-primary/20 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-5">
                <span className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors leading-none select-none">
                  {step.number}
                </span>
                <div className="space-y-2 pt-1">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-accent-foreground bg-accent px-2.5 py-1 rounded-full">
                    {step.tag}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
