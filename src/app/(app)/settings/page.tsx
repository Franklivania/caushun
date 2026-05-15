import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/layout/page-header"
import { SettingsClient } from "@/components/settings/settings-client"

export const metadata = { title: "Settings — Caushun" }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      fullName: users.fullName,
      phone: users.phone,
      walletAddress: users.walletAddress,
      role: users.role,
      onboardingComplete: users.onboardingComplete,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) redirect("/auth")

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and wallet." breadcrumbs={[{ label: "Settings" }]} />
      <SettingsClient user={user} />
    </div>
  )
}
