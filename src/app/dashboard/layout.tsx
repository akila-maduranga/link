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
      {/* lg:flex (not flex): below lg the mobile tab strip is a full-width block above the
          content — as a flex sibling its wide scrollable row starved the content column
          to ~76px and pushed everything off-screen on phones. */}
      <div className="lg:flex lg:gap-8">
        <DashboardNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
