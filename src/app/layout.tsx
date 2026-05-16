import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://caushun.vercel.app"
const OG_IMAGE = "https://res.cloudinary.com/dgtoh3s2a/image/upload/v1778898315/caushun_ypf6eb.png"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Caushun — Your caution fee. Protected.",
    template: "%s | Caushun",
  },
  description:
    "Nigeria's first on-chain rental security deposit platform. Landlords and tenants, protected by smart contracts on Stellar.",
  keywords: [
    "caushun",
    "rental deposit",
    "security deposit",
    "caution fee",
    "escrow",
    "blockchain escrow",
    "Stellar",
    "Trustless Work",
    "Nigeria",
    "proptech Nigeria",
    "landlord tenant protection",
    "on-chain escrow",
    "rental protection",
    "smart contract deposit",
    "USDC escrow",
  ],
  authors: [
    {
      name: "Chibuzo Franklin Odigbo",
      url: "https://github.com/franklivania",
    },
  ],
  creator: "Chibuzo Franklin Odigbo",
  publisher: "Caushun",
  category: "Finance",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Caushun",
    title: "Caushun — Your caution fee. Protected.",
    description:
      "Nigeria's first on-chain rental security deposit platform. Landlords and tenants, protected by smart contracts on Stellar.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Caushun — On-chain rental deposit protection",
      },
    ],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caushun — Your caution fee. Protected.",
    description:
      "Nigeria's first on-chain rental security deposit platform. Landlords and tenants, protected by smart contracts on Stellar.",
    images: [OG_IMAGE],
    creator: "@franklivania",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("h-full antialiased", figtree.variable)}>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
