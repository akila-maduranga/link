/**
 * Registration email-domain policy (shared by server validators and the
 * register form). Restricts NEW account signups to trusted consumer
 * providers; existing accounts are never affected.
 *
 * Default providers:
 *   Gmail  → gmail.com, googlemail.com
 *   iCloud → icloud.com, me.com, mac.com
 *
 * Override server-side with ALLOWED_EMAIL_DOMAINS in .env:
 *   comma-separated list of domains, or "*" to allow any address.
 */

export const DEFAULT_ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "icloud.com",
  "me.com",
  "mac.com",
] as const

/** Server-side only: reads ALLOWED_EMAIL_DOMAINS. Returns null = no restriction. */
export function getAllowedEmailDomains(): readonly string[] | null {
  // Client bundles have no access to server env — this function must only
  // be called from server code (API routes / server components).
  const raw = process.env.ALLOWED_EMAIL_DOMAINS?.trim().toLowerCase()
  if (!raw) return DEFAULT_ALLOWED_EMAIL_DOMAINS // unset → default policy (Gmail + iCloud)
  if (raw === "*") return null
  const list = raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
  return list.length > 0 ? list : DEFAULT_ALLOWED_EMAIL_DOMAINS
}

/** True when the email's domain is in the allowed list (null list = allow all). */
export function isAllowedEmail(email: string, domains: readonly string[] | null): boolean {
  if (!domains) return true
  const domain = email.trim().toLowerCase().split("@")[1] ?? ""
  return domain.length > 0 && domains.includes(domain)
}

function isDefaultList(domains: readonly string[]): boolean {
  return (
    domains.length === DEFAULT_ALLOWED_EMAIL_DOMAINS.length &&
    DEFAULT_ALLOWED_EMAIL_DOMAINS.every((d) => domains.includes(d))
  )
}

/** Short human label, e.g. "Gmail and iCloud" or a custom domain list. */
export function allowedDomainsLabel(domains: readonly string[]): string {
  if (isDefaultList(domains)) return "Gmail and iCloud"
  return domains.join(", ")
}

/** Error message shown when a signup email is outside the allowed list. */
export function emailDomainError(domains: readonly string[] | null): string {
  if (!domains) return ""
  if (isDefaultList(domains)) return "Only Gmail or iCloud email addresses can register"
  return `Registrations are limited to these email domains: ${domains.join(", ")}`
}
