import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BodyTooLargeError, fail, ok } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"
import { createPremiumOrder, paypalConfigured, PayPalError } from "@/lib/paypal"
import { isPremiumActive } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/paypal/create-order — create a PayPal order for one premium
 * period. The AMOUNT IS FIXED SERVER-SIDE (OWASP/PayPal guidance: never
 * accept amounts from the browser); the body is intentionally empty and
 * custom_id silently binds the order to the session user.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)
  if (!session.verified) return fail("Verify your email first", 403)

  if (!paypalConfigured()) {
    return fail("Payments are not configured yet — the site admin needs to set PayPal credentials", 503)
  }

  // Anti-abuse: order creation is a rate-limited PayPal API call.
  const rl = rateLimit(`paypal-create:${session.sub}`, 6, 10 * 60 * 1000) // 6 / 10 min
  if (!rl.ok) {
    return fail("Too many payment attempts — please wait a few minutes.", 429)
  }

  // Drain the body: nothing is needed for order creation (the amount comes
  // from config, the user from the session). Empty bodies are fine — that's
  // exactly what the PayPal button's createOrder callback sends. Junk that
  // IS sent must be valid JSON within the global size cap.
  try {
    const raw = await request.text()
    if (raw.length > 32 * 1024) throw new BodyTooLargeError()
    if (raw.trim()) JSON.parse(raw)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { premiumUntil: true },
    })

    const orderId = await createPremiumOrder(session.sub)
    console.log(
      `[paypal] order created: ${orderId} for ${session.email} (premium=${isPremiumActive(user?.premiumUntil)})`
    )
    return ok({ orderId })
  } catch (err) {
    if (err instanceof PayPalError) {
      console.error("[paypal] create-order failed:", err.status, err.message)
      return fail("Could not start the PayPal checkout. Please try again in a moment.", 502)
    }
    console.error("[paypal] create-order error:", err)
    return fail("Could not start the checkout. Please try again.", 500)
  }
}
