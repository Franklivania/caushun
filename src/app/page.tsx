import { LandingNavbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { TrustBanner } from "@/components/landing/trust-banner"
import { FAQ } from "@/components/landing/faq"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="bg-white">
      <LandingNavbar />
      <Hero />
      <HowItWorks />
      <Features />
      <TrustBanner />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
