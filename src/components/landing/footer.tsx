import Link from "next/link"
import { Globe } from "lucide-react"

function GithubIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

const links = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "Get started", href: "/auth" },
  ],
  Platform: [
    { label: "Trustless Work", href: "https://trustlesswork.com", external: true },
    { label: "Escrow Viewer", href: "https://viewer.trustlesswork.com", external: true },
    { label: "Stellar", href: "https://stellar.org", external: true },
    { label: "Freighter Wallet", href: "https://freighter.app", external: true },
  ],
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-black tracking-tight text-accent">
              Caushun
            </Link>
            <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-xs">
              On-chain rental security deposits for landlords and tenants who deserve better.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/Trustless-Work"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <GithubIcon size={15} />
              </a>
              <a
                href="https://trustlesswork.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Globe size={15} />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {"external" in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/40">
          <p>© {new Date().getFullYear()} Caushun. All rights reserved.</p>
          <p>
            Built with{" "}
            <a
              href="https://trustlesswork.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Trustless Work
            </a>{" "}
            on Stellar
          </p>
        </div>
      </div>
    </footer>
  )
}
