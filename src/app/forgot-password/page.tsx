import { Suspense } from "react"
import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const dynamic = "force-dynamic"

// SSR (not prerendered): per-request CSP nonces from src/proxy.ts only apply to dynamically
// rendered responses — a prerendered shell would ship nonce-less scripts that strict-dynamic blocks.
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false }, // one-time token flow — not for search
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}
