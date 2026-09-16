/**
 * Premium entitlement + free-tier quota helpers.
 *
 * Business rules:
 *  - Premium = $3.00 USD for PREMIUM_DAYS (default 30) days, paid via PayPal
 *    Orders API v2 (one-time payment, manual renewal). Renewals stack:
 *    paying again extends from the LATER of now / current expiry.
 *  - Free accounts: max FREE_TRACKABLE_LIMIT short links WITH click
 *    analytics; unlimited untrackable short links.
 *  - Submitting community/group links is free for everyone (no quota).
 *  - ADMIN accounts are premium by default, forever — no renewal needed.
 */

/** Max short links with click analytics a free (non-premium) account may create. */
export const FREE_TRACKABLE_LIMIT = 2

/** Premium price as a fixed 2-decimal string (PayPal amount format). */
export function premiumPrice(): string {
  const raw = process.env.PREMIUM_PRICE_USD || "3.00"
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0 || n > 500) return "3.00"
  return n.toFixed(2)
}

export function premiumCurrency(): string {
  return (process.env.PREMIUM_CURRENCY || "USD").toUpperCase()
}

/** Days of premium granted per successful payment / admin grant. */
export function premiumDays(): number {
  const n = Number(process.env.PREMIUM_DAYS || 30)
  if (!Number.isFinite(n) || n < 1 || n > 3650) return 30
  return Math.floor(n)
}

/**
 * Premium is active while premiumUntil lies in the future. Admin accounts
 * are premium by default (role === "ADMIN") regardless of premiumUntil,
 * so existing admin installs get premium without any data migration.
 */
export function isPremiumActive(
  premiumUntil: Date | string | null | undefined,
  role?: string | null,
): boolean {
  if (role === "ADMIN") return true
  if (!premiumUntil) return false
  return new Date(premiumUntil).getTime() > Date.now()
}

/**
 * Far-future expiry stamped on the FIRST registered account (the admin
 * bootstrap) so new installs also carry the entitlement in the database.
 */
export function adminDefaultPremiumUntil(): Date {
  return new Date("2099-12-31T23:59:59.000Z")
}

/**
 * Compute the new expiry for a grant. Renewing early stacks:
 * base = current expiry when it is still in the future, otherwise now.
 */
export function nextPremiumUntil(current: Date | string | null | undefined, days: number): Date {
  const cur = current ? new Date(current).getTime() : 0
  const base = cur > Date.now() ? cur : Date.now()
  return new Date(base + days * 24 * 60 * 60 * 1000)
}
