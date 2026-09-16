import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { getAllowedEmailDomains } from "@/lib/email-domains"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

// SSR (not prerendered): per-request CSP nonces from src/proxy.ts only apply to dynamically
// rendered responses — a prerendered shell would ship nonce-less scripts that strict-dynamic blocks.
export const metadata: Metadata = {
  title: "Create a free account",
  description:
    "Create a free FindLink account to list your Telegram channels, WhatsApp groups and communities in the directory — and shorten URLs with click analytics.",
  alternates: { canonical: "/register" },
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  // Already signed in? Sending them to a signup form they can't use is a
  // dead end — route them back into the product instead.
  const session = await getSession()
  if (session) {
    const { next } = await searchParams
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
    redirect(safeNext)
  }

  // Computed on the server (env-aware) and passed down so the client-side
  // hint + instant validation always match the server policy exactly.
  const allowedDomains = getAllowedEmailDomains()

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterForm allowedDomains={allowedDomains} />
    </Suspense>
  )
}
