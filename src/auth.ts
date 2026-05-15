import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createHmac } from "crypto"
import { cookies } from "next/headers"
import type { AdapterUser } from "next-auth/adapters"

function verifyLinkIntent(value: string): string | null {
  const parts = value.split(":")
  if (parts.length !== 3) return null
  const [userId, expiry, sig] = parts
  const expected = createHmac("sha256", process.env.INVITE_TOKEN_SECRET!)
    .update(`${userId}:${expiry}`)
    .digest("hex")
  if (sig !== expected || Date.now() > Number(expiry)) return null
  return userId
}

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

const linkingAdapter = {
  ...baseAdapter,
  async createUser(data: AdapterUser) {
    const cookieStore = await cookies()
    const intent = cookieStore.get("caushun-link-intent")?.value
    if (intent) {
      const userId = verifyLinkIntent(intent)
      if (userId) {
        const [updated] = await db
          .update(users)
          .set({
            email: data.email,
            name: data.name,
            image: data.image,
            emailVerified: data.emailVerified,
          })
          .where(eq(users.id, userId))
          .returning()
        cookieStore.delete("caushun-link-intent")
        return updated as unknown as AdapterUser
      }
    }
    return baseAdapter.createUser!(data)
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: linkingAdapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
      },
      async authorize(credentials) {
        const walletAddress = credentials?.walletAddress
        if (typeof walletAddress !== "string" || walletAddress.length !== 56) return null
        const [user] = await db
          .select({ id: users.id, name: users.fullName, email: users.email, image: users.image })
          .from(users)
          .where(eq(users.walletAddress, walletAddress))
        if (!user) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const cookieStore = await cookies()
        const intent = cookieStore.get("caushun-link-intent")?.value
        if (intent) {
          const userId = verifyLinkIntent(intent)
          // Google email already belongs to a different Caushun account — block the link
          if (userId && user.id !== userId) {
            cookieStore.delete("caushun-link-intent")
            return "/settings?error=GoogleAccountInUse"
          }
        }
      }
      return true
    },
    async jwt({ token, user }) {
      // `user` is only present on the first sign-in — load DB fields into the token then
      if (user?.id) {
        const [dbUser] = await db
          .select({
            role: users.role,
            walletAddress: users.walletAddress,
            fullName: users.fullName,
            phone: users.phone,
            onboardingComplete: users.onboardingComplete,
          })
          .from(users)
          .where(eq(users.id, user.id))

        if (dbUser) {
          token.id = user.id
          token.role = dbUser.role
          token.walletAddress = dbUser.walletAddress
          token.fullName = dbUser.fullName
          token.phone = dbUser.phone
          token.onboardingComplete = dbUser.onboardingComplete
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Re-fetch latest user state from DB on every session read so role/wallet updates are instant
        const [dbUser] = await db
          .select({
            role: users.role,
            walletAddress: users.walletAddress,
            fullName: users.fullName,
            phone: users.phone,
            onboardingComplete: users.onboardingComplete,
          })
          .from(users)
          .where(eq(users.id, token.id as string))

        session.user.id = token.id as string
        session.user.role = (dbUser?.role ?? null) as "landlord" | "tenant" | "admin" | null
        session.user.walletAddress = dbUser?.walletAddress ?? null
        session.user.fullName = dbUser?.fullName ?? null
        session.user.phone = dbUser?.phone ?? null
        session.user.onboardingComplete = dbUser?.onboardingComplete ?? false
      }
      return session
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
})

// Augment next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: "landlord" | "tenant" | "admin" | null
      walletAddress?: string | null
      fullName?: string | null
      phone?: string | null
      onboardingComplete?: boolean
    }
  }
}
