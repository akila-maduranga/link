import { after } from "next/server"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"
import {
  captureOrder,
  getOrder,
  ORDER_ID_RE,
  paypalConfigured,
  PayPalError,
  verifyCapture,
  type PayPalCapture,
} from "@/lib/paypal"
import { isPremiumActive, nextPremiumUntil, premiumDays, premiumPrice, premiumCurrency } from "@/lib/premium"
import { sendPremiumPaymentEmail, sendPremiumReceiptEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function currentStatus(premiumUntil: Date | null) {
  return {
    premiumUntil: premiumUntil?.toISOString() ?? null,
    premium: isPremiumActive(premiumUntil),
  }
}

/**
 * POST /api/paypal/capture-order { orderId } — capture the buyer-approved
 * order SERVER-SIDE and credit premium exactly once.
 *
 * Security chain (OWASP + PayPal guidelines):
 *  1. Session + verified-email required; order id format-checked.
 *  2. Idempotency short-circuit: an order already recorded in Payment is
 *     returned as success without touching PayPal again.
 *  3. Capture is executed server-to-server over HTTPS (the client's
 *     onApprove proves nothing by itself).
 *  4. verifyCapture: status + capture status + exact amount + currency +
 *     custom_id === session user. Any mismatch → 400, no credit.
 *  5. Payment row carries a UNIQUE orderId — the DB is the last line of
 *     defense against double-crediting, even under concurrent requests.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)
  if (!session.verified) return fail("Verify your email first", 403)

  // Parse + validate input BEFORE anything else — malformed payloads get 400
  // regardless of whether PayPal credentials are configured.
  let body: { orderId?: unknown }
  try {
    body = (await readJsonBody(request)) as { orderId?: unknown }
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
  if (!ORDER_ID_RE.test(orderId)) {
    return fail("Invalid order reference", 400)
  }

  if (!paypalConfigured()) {
    return fail("Payments are not configured yet", 503)
  }

  const rl = rateLimit(`paypal-capture:${session.sub}`, 12, 10 * 60 * 1000) // 12 / 10 min
  if (!rl.ok) return fail("Too many requests — please wait a few minutes.", 429)

  // --- Idempotency: already credited? Return the recorded outcome. -------
  const existing = await db.payment.findUnique({
    where: { orderId },
    select: { id: true, userId: true },
  })
  if (existing) {
    const user = await db.user.findUnique({
      where: { id: existing.userId },
      select: { premiumUntil: true },
    })
    // Only the buyer may replay their own order.
    if (existing.userId !== session.sub) return fail("Not your order", 403)
    return ok({ ...currentStatus(user?.premiumUntil ?? null), replayed: true })
  }

  // --- Capture server-side -----------------------------------------------
  let order: PayPalCapture
  try {
    order = await captureOrder(orderId)
  } catch (err) {
    if (err instanceof PayPalError && err.issue === "ORDER_ALREADY_CAPTURED") {
      // Capture happened (maybe our first response was lost). Re-fetch and
      // verify — then credit if the DB row is still missing.
      try {
        order = await getOrder(orderId)
      } catch (err2) {
        console.error("[paypal] order re-fetch failed:", err2)
        return fail("Could not verify this payment. Please contact support.", 502)
      }
    } else if (err instanceof PayPalError) {
      console.error("[paypal] capture failed:", err.status, err.message)
      return fail(
        err.status === 422
          ? "PayPal could not complete this payment. Please try again."
          : "Payment capture failed. Please try again in a moment.",
        502
      )
    } else {
      console.error("[paypal] capture error:", err)
      return fail("Payment capture failed. Please try again.", 502)
    }
  }

  // --- Verify before crediting -------------------------------------------
  const verdict = verifyCapture(order, session.sub)
  if (!verdict.ok) {
    console.error(`[paypal] VERIFICATION FAILED order=${orderId} user=${session.sub}: ${verdict.reason}`)
    return fail(`Payment verification failed: ${verdict.reason}`, 400)
  }
  const capture = verdict.capture

  // --- Credit exactly once (DB unique orderId = final guard) --------------
  const days = premiumDays()
  let premiumUntil: Date
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.sub },
        select: { premiumUntil: true },
      })
      const until = nextPremiumUntil(user?.premiumUntil ?? null, days)
      await tx.payment.create({
        data: {
          userId: session.sub,
          orderId,
          captureId: capture.captureId,
          amount: capture.amount ?? premiumPrice(),
          currency: (capture.currency ?? premiumCurrency()).toUpperCase(),
          status: "COMPLETED",
          payerEmail: capture.payerEmail,
          payerName: capture.payerName,
          daysGranted: days,
          source: "PAYPAL",
        },
      })
      await tx.user.update({
        where: { id: session.sub },
        data: { premiumUntil: until },
      })
      return until
    })
    premiumUntil = result
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Concurrent request credited this order first — idempotent success.
      const user = await db.user.findUnique({
        where: { id: session.sub },
        select: { premiumUntil: true },
      })
      return ok({ ...currentStatus(user?.premiumUntil ?? null), replayed: true })
    }
    console.error("[paypal] crediting failed:", err)
    return fail("Payment verified but crediting failed — please contact support.", 500)
  }

  console.log(
    `[paypal] PREMIUM GRANTED order=${orderId} user=${session.email} days=${days} until=${premiumUntil.toISOString()}`
  )

  // --- Emails (best effort, after the response goes out) -------------------
  after(async () => {
    try {
      await sendPremiumPaymentEmail({
        buyerName: session.name,
        buyerEmail: session.email,
        amount: capture.amount ?? premiumPrice(),
        currency: (capture.currency ?? premiumCurrency()).toUpperCase(),
        orderId,
        payerEmail: capture.payerEmail,
        days,
        premiumUntil,
      })
      await sendPremiumReceiptEmail(session.email, session.name, {
        amount: capture.amount ?? premiumPrice(),
        currency: (capture.currency ?? premiumCurrency()).toUpperCase(),
        days,
        premiumUntil,
        orderId,
      })
    } catch (err) {
      console.error("[paypal] notification emails failed:", err)
    }
  })

  return ok({ ...currentStatus(premiumUntil), replayed: false })
}
