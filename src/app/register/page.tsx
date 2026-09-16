import { Suspense } from "react"
import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"
import { getAllowedEmailDomains } from "@/lib/email-domains"

export const dynamic = "force-dynamic"

// SSR (not prerendered): per-request CSP nonces from src/proxy.ts only apply to dynamically
// rendered responses — a prerendered shell would ship nonce-less scripts that strict-dynamic blocks.
export const metadata: Metadata = { title: "Create account" }

export default function RegisterPage() {
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
