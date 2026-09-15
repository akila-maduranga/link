import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UnverifiedBanner } from "@/components/dashboard/unverified-banner"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login?next=/dashboard")

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UnverifiedBanner verified={session.verified} />
      <div className="flex gap-8">
        <DashboardNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
