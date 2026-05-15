import Image from "next/image"
import { AuthClient } from "@/components/auth/auth-client"
import Link from "next/link"

export const metadata = {
  title: "Sign in — Caushun",
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Left column: sign-in ──────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center px-8 sm:px-16 py-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-tight text-primary">
              Caushun
            </span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-foreground/55 text-sm leading-relaxed">
              Sign in with Google or connect your Stellar wallet to get started.
              You can link both after sign-in.
            </p>
          </div>

          <AuthClient />

          <p className="text-center text-xs text-foreground/40">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-foreground/70 transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline cursor-pointer hover:text-foreground/70 transition-colors">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>

      {/* ── Right column: image (hidden on mobile) ────────── */}
      <div className="hidden md:block relative flex-1">
        <Image
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85"
          alt="A bright, modern apartment living room"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/30" />
        <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
          <p className="text-2xl font-bold leading-tight">
            Your caution fee, protected on-chain.
          </p>
          <p className="text-white/70 text-sm">
            Smart contracts replace blind trust between landlords and tenants.
          </p>
        </div>
      </div>
    </div>
  )
}
