import { Suspense } from "react"
import type { Metadata } from "next"
import { ExploreClient } from "@/components/links/explore-client"

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse the FindLink directory — Telegram channels, WhatsApp groups, Facebook pages and more, filtered by category, country and language.",
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ExploreClient />
    </Suspense>
  )
}
