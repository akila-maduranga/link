import { Suspense } from "react"
import type { Metadata } from "next"
import { VerifyEmailClient } from "@/components/auth/verify-email-client"

export const metadata: Metadata = { title: "Verify email" }

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}
