import type { Metadata } from "next"
import { SubmitLinkForm } from "@/components/dashboard/submit-link-form"

export const metadata: Metadata = { title: "Submit a link" }

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Submit a community</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your Telegram channels, WhatsApp groups, Facebook pages and more with the
          directory. Listing is free and instant.
        </p>
      </div>
      <SubmitLinkForm />
    </div>
  )
}
