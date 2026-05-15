import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24 px-4 bg-[#F9FAFB]">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Ready to protect your deposit?
        </h2>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          Join landlords and tenants already using on-chain escrow for a fairer rental experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth">
            <Button
              size="lg"
              className="rounded-full px-10 h-12 bg-primary text-primary-foreground font-semibold gap-2 hover:bg-primary/90"
            >
              Get started free <ArrowRight size={18} />
            </Button>
          </Link>
          <a
            href="https://docs.trustlesswork.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-10 h-12 font-semibold border-border hover:bg-muted"
            >
              Read the docs
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
