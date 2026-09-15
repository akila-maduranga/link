import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { AdminClient } from "@/components/dashboard/admin-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Admin panel" }

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect("/login?next=/admin")
  if (session.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminClient />
    </div>
  )
}
