import { Suspense } from "react"
import type { Metadata } from "next"
import { ExploreClient } from "@/components/links/explore-client"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, collectionSchema } from "@/lib/seo"

export const dynamic = "force-dynamic"

// SSR (not prerendered): per-request CSP nonces from src/proxy.ts only apply to dynamically
// rendered responses — a prerendered shell would ship nonce-less scripts that strict-dynamic blocks.
export const metadata: Metadata = {
  title: "Explore the Community Directory – Telegram, WhatsApp, Discord & More",
  description:
    "Search the full community directory: Telegram channels, WhatsApp groups, Discord servers and more, filtered by category, country and language. Plus a free URL shortener.",
  keywords: [
    "link directory",
    "community directory",
    "explore communities",
    "telegram channel directory",
    "whatsapp group links",
    "find online communities",
  ],
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Explore the Community Directory – Telegram, WhatsApp, Discord & More",
    description:
      "Search the full community directory: Telegram channels, WhatsApp groups, Discord servers and more, filtered by category, country and language. Plus a free URL shortener.",
    url: "/explore",
    siteName: "FindLink",
    type: "website",
  },
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
      {/* Directory-level CollectionPage (no fixed item list — filters are
          client-side, so the entity describes the collection itself) */}
      <JsonLd
        data={collectionSchema({
          name: "FindLink community directory",
          description:
            "The full FindLink directory of social communities — Telegram channels, WhatsApp groups, Facebook pages and more, filterable by category, country and language.",
          url: absoluteUrl("/explore"),
          items: [],
        })}
      />
      <ExploreClient />
    </Suspense>
  )
}
