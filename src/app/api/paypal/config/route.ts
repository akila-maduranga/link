import { ok } from "@/lib/api"
import { paypalConfigured, paypalMode } from "@/lib/paypal"
import { premiumCurrency, premiumDays, premiumPrice, FREE_TRACKABLE_LIMIT } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/paypal/config — public runtime configuration for the premium
 * checkout page. The client id is public by design (PayPal docs); it is
 * served at RUNTIME (not baked at build time) so credentials can be added
 * to .env on the VPS without rebuilding the image. The secret never leaves
 * the server.
 */
export async function GET() {
  const enabled = paypalConfigured()
  return ok({
    enabled,
    clientId: enabled ? process.env.PAYPAL_CLIENT_ID : null,
    mode: paypalMode(),
    price: premiumPrice(),
    currency: premiumCurrency(),
    days: premiumDays(),
    freeTrackableLimit: FREE_TRACKABLE_LIMIT,
  })
}
