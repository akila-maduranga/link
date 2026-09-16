/**
 * PayPal Orders API v2 client (server-only) — built-in fetch, no SDK.
 *
 * Flow (PayPal "standard checkout", one-time payment):
 *  1. POST /v2/checkout/orders          — server creates the order with the
 *     amount fixed SERVER-SIDE (never trusted from the client) and
 *     custom_id = the paying user's id (binding verified at capture time).
 *  2. Client-side JS SDK Smart Payment Buttons let the buyer approve on
 *     PayPal's domain — card data never touches this server (PCI SAQ-A).
 *  3. POST /v2/checkout/orders/{id}/capture — server captures and then
 *     VERIFIES the response: status, capture status, amount, currency and
 *     custom_id must all match before the caller credits anything.
 *
 * Secret lives only in PAYPAL_CLIENT_SECRET (server env). The client id is
 * public by design and is served to the browser via /api/paypal/config.
 */

import { premiumCurrency, premiumDays, premiumPrice } from "@/lib/premium"

const API_BASE = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const

export type PayPalMode = "sandbox" | "live"

/** PayPal order ids: uppercase alphanumeric, officially 1–36 chars (observed ~17). */
export const ORDER_ID_RE = /^[A-Z0-9]{10,36}$/

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

export function paypalMode(): PayPalMode {
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"
}

/**
 * API base URL. The PAYPAL_API_BASE override exists for integration testing
 * against a local mock (and rare debugging) — defaults to the official hosts.
 */
function baseUrl(): string {
  const override = (process.env.PAYPAL_API_BASE || "").trim()
  if (override.startsWith("http://127.0.0.1:") || override.startsWith("http://localhost:")) {
    return override.replace(/\/+$/, "")
  }
  return API_BASE[paypalMode()]
}

export class PayPalError extends Error {
  status: number
  issue?: string
  constructor(message: string, status: number, issue?: string) {
    super(message)
    this.name = "PayPalError"
    this.status = status
    this.issue = issue
  }
}

/* ------------------------------- OAuth token ------------------------------- */

let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token

  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    // Bad credentials are the common case — surface something actionable.
    const hint = res.status === 401 ? " (check PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_MODE)" : ""
    throw new PayPalError(`PayPal auth failed (${res.status})${hint}`, res.status)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  // Refresh one minute before actual expiry; tokens live ~9h.
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 32400) - 60) * 1000,
  }
  return tokenCache.token
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

/* ------------------------------ Order creation ----------------------------- */

/** Create a $3 premium order bound to the user via custom_id. Returns order id. */
export async function createPremiumOrder(userId: string): Promise<string> {
  const token = await getAccessToken()

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: { currency_code: premiumCurrency(), value: premiumPrice() },
        custom_id: userId, // verified again at capture time — never trust the client
        description: `FindLink Premium — ${premiumDays()} days`,
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: "FindLink",
          shipping_preference: "NO_SHIPPING", // digital good
          user_action: "PAY_NOW",
        },
      },
    },
  }

  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "PayPal-Request-Id": crypto.randomUUID(), // idempotent create
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })

  const data = (await res.json().catch(() => null)) as { id?: string } | null
  if (!res.ok || !data?.id) {
    throw new PayPalError(`PayPal order creation failed (${res.status})`, res.status)
  }
  return data.id
}

/* -------------------------------- Capture ---------------------------------- */

export interface PayPalCapture {
  id: string // order id
  status: string // order-level status
  captureId: string | null
  captureStatus: string | null // capture-level status (may be DECLINED/PENDING)
  amount: string | null
  currency: string | null
  customId: string | null
  payerEmail: string | null
  payerName: string | null
}

interface PayPalOrderResponse {
  id?: string
  status?: string
  payer?: {
    email_address?: string
    name?: { given_name?: string; surname?: string }
  }
  purchase_units?: Array<{
    custom_id?: string
    payments?: {
      captures?: Array<{
        id?: string
        status?: string
        amount?: { currency_code?: string; value?: string }
      }>
    }
  }>
}

function mapOrder(order: PayPalOrderResponse): PayPalCapture {
  const unit = order.purchase_units?.[0]
  const capture = unit?.payments?.captures?.[0]
  const given = order.payer?.name?.given_name ?? ""
  const surname = order.payer?.name?.surname ?? ""
  return {
    id: order.id ?? "",
    status: order.status ?? "UNKNOWN",
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
    customId: unit?.custom_id ?? null,
    payerEmail: order.payer?.email_address ?? null,
    payerName: [given, surname].filter(Boolean).join(" ") || null,
  }
}

/**
 * Capture (charge) an approved order. Idempotent: PayPal allows only one
 * capture per CAPTURE-intent order; a second attempt returns 422
 * ORDER_ALREADY_CAPTURED, which we surface as PayPalError.issue so the
 * caller can re-check the order and treat it as "already processed".
 */
export async function captureOrder(orderId: string): Promise<PayPalCapture> {
  const token = await getAccessToken()
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      // Stable per order: a retry after a network blip replays the original
      // request instead of re-executing it.
      "PayPal-Request-Id": `capture-${orderId}`,
      Prefer: "return=representation",
    },
    body: "{}",
    signal: AbortSignal.timeout(30_000),
  })

  if (res.status === 422) {
    const data = (await res.json().catch(() => null)) as {
      details?: Array<{ issue?: string; description?: string }>
    } | null
    const issue = data?.details?.[0]?.issue ?? "UNPROCESSABLE"
    throw new PayPalError(
      data?.details?.[0]?.description ?? "Order could not be captured",
      422,
      issue
    )
  }

  const data = (await res.json().catch(() => null)) as PayPalOrderResponse | null
  if (!res.ok || !data) {
    throw new PayPalError(`PayPal capture failed (${res.status})`, res.status)
  }
  return mapOrder(data)
}

/** Fetch an order without capturing (used after ORDER_ALREADY_CAPTURED). */
export async function getOrder(orderId: string): Promise<PayPalCapture> {
  const token = await getAccessToken()
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(20_000),
  })
  const data = (await res.json().catch(() => null)) as PayPalOrderResponse | null
  if (!res.ok || !data) {
    throw new PayPalError(`PayPal order fetch failed (${res.status})`, res.status)
  }
  return mapOrder(data)
}

/* --------------------------- Verification (security) ----------------------- */

export type VerificationResult =
  | { ok: true; capture: PayPalCapture }
  | { ok: false; reason: string }

/**
 * The gate EVERYTHING must pass before premium is credited. Checks, in order:
 *  - order-level status is COMPLETED
 *  - a capture resource exists and is itself COMPLETED (PayPal's own schema
 *    warns a COMPLETED order can still hold a DECLINED capture)
 *  - the money actually moved: amount + currency match the configured price
 *  - custom_id binds this exact order to this exact paying user (prevents
 *    replaying someone else's order id against the capture endpoint)
 */
export function verifyCapture(order: PayPalCapture, userId: string): VerificationResult {
  if (order.status !== "COMPLETED") return { ok: false, reason: `Order status is ${order.status}` }
  if (!order.captureId) return { ok: false, reason: "No capture resource on the order" }
  if (order.captureStatus !== "COMPLETED") {
    // PayPal: a COMPLETED order can still hold a DECLINED / PENDING capture.
    return { ok: false, reason: `Payment not completed (${order.captureStatus ?? "UNKNOWN"})` }
  }
  if (order.amount !== premiumPrice()) {
    return { ok: false, reason: `Amount mismatch: paid ${order.amount ?? "n/a"}, expected ${premiumPrice()}` }
  }
  if ((order.currency ?? "").toUpperCase() !== premiumCurrency()) {
    return { ok: false, reason: `Currency mismatch: ${order.currency ?? "n/a"}` }
  }
  if (order.customId !== userId) {
    return { ok: false, reason: "Order does not belong to this account" }
  }
  return { ok: true, capture: order }
}
