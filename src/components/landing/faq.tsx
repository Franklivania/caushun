import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "What is Caushun?",
    a: "Caushun is a rental security deposit platform built on Stellar. Instead of handing your deposit to a landlord, it's locked in a smart contract that only releases when both parties agree — or when a dispute is resolved.",
  },
  {
    q: "Do I need cryptocurrency to use Caushun?",
    a: "You need a Stellar wallet (Freighter is free and takes 2 minutes to set up) and USDC on Stellar's testnet for now. On mainnet, you'll need USDC — a stable digital dollar pegged 1:1 to the US dollar.",
  },
  {
    q: "What happens if the landlord refuses to release the deposit?",
    a: "The landlord cannot unilaterally withhold your deposit. If they don't approve or dispute within the checkout window, Caushun's platform wallet releases funds automatically. If there's a dispute, Caushun mediates using the photo evidence both parties submitted.",
  },
  {
    q: "Is Caushun a bank or financial institution?",
    a: "No. Caushun is a smart contract platform. We never hold your money — it lives in a Stellar escrow contract. We act as the dispute resolver, not a custodian.",
  },
  {
    q: "What if I disagree with the landlord's damage assessment?",
    a: "You can raise a dispute. Caushun will review the move-in and move-out photos submitted by both parties, then issue a verdict — splitting the deposit fairly based on the evidence.",
  },
  {
    q: "Is this only for Nigerian renters?",
    a: "We built Caushun with the Nigerian rental market in mind, but any landlord or tenant on Stellar can use it. The escrow works in any jurisdiction.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-sm font-semibold text-accent-foreground uppercase tracking-widest">
            FAQ
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Common questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-2 space-x-4 border-none">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-xl px-5 data-[state=open]:border-primary/20 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-sm py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/60 text-sm leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
