import { notFound } from "next/navigation"

/**
 * Dynamic 404 catch-all.
 *
 * Unmatched URLs land here (every concrete route — /s/[code], /go/[slug],
 * /api/*, /dashboard/* … — outranks a catch-all). Rendering the not-found
 * boundary inside a force-dynamic page means the response is rendered
 * per-request, so the per-request CSP nonce from src/proxy.ts is stamped on
 * its scripts. Without this, the prerendered /_not-found shell would ship
 * nonce-less scripts that 'strict-dynamic' blocks (dead hydration).
 */
export const dynamic = "force-dynamic"

export default function NotFoundCatchAll() {
  notFound()
}
