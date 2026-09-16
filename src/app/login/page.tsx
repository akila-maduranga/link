import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

// SSR (not prerendered): per-request CSP nonces from src/proxy.ts only apply to dynamically
// rendered responses — a prerendered shell would ship nonce-less scripts that strict-dynamic blocks.
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to FindLink to manage your directory listings, shorten URLs and track every click with detailed analytics.",
  alternates: { canonical: "/login" },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  // Already signed in? No reason to stare at a login form — go straight to
  // the app (or back to the page that sent the user here).
  const session = await getSession()
  if (session) {
    const { next } = await searchParams
    // Only same-site absolute paths; "//evil.com" is a protocol-relative URL.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
    redirect(safeNext)
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
