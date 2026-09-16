import { Resend } from "resend"

const BRAND = process.env.NEXT_PUBLIC_APP_NAME || "FindLink"

export interface EmailResult {
  delivered: boolean
  devUrl?: string // present only when email delivery is not configured (dev mode)
  error?: string
}

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function getFrom(): string {
  return process.env.EMAIL_FROM || `${BRAND} <onboarding@resend.dev>`
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function baseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "")
}

/* ---------------------------------- Layout --------------------------------- */

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;padding:0;background:#0c0f0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0f0d;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#141916;border:1px solid #24302a;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 32px 8px 32px;" align="center">
            <span style="display:inline-block;background:#10b981;color:#06251b;font-weight:700;font-size:15px;letter-spacing:0.5px;padding:6px 14px;border-radius:8px;">${BRAND.toUpperCase()}</span>
          </td></tr>
          <tr><td style="padding:12px 32px 4px 32px;" align="center">
            <h1 style="margin:0;color:#f4faf7;font-size:22px;font-weight:700;">${title}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 32px 32px;">
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #24302a;" align="center">
            <p style="margin:0;color:#7d8f86;font-size:12px;line-height:18px;">
              This is an automated message from ${BRAND}. If you did not request it, you can safely ignore this email.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function buttonHtml(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:24px 0;"><tr>
    <td style="background:#10b981;border-radius:10px;">
      <a href="${url}" style="display:inline-block;padding:13px 32px;color:#06251b;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;">${label}</a>
    </td>
  </tr></table>
  <p style="margin:16px 0 0 0;color:#7d8f86;font-size:12px;line-height:20px;word-break:break-all;">
    Or paste this link into your browser:<br /><a href="${url}" style="color:#34d399;">${url}</a>
  </p>`
}

/* ------------------------------ Send functions ----------------------------- */

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<EmailResult> {
  const url = `${baseUrl()}/verify-email?token=${token}`
  const html = emailShell(
    "Verify your email",
    `<p style="margin:0 0 8px 0;color:#c9d7d0;font-size:15px;line-height:24px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0;color:#c9d7d0;font-size:15px;line-height:24px;">Welcome to ${BRAND}! Confirm your email address to unlock link submissions and the URL shortener.</p>
     ${buttonHtml(url, "Verify Email")}`
  )

  return deliver(to, `Verify your ${BRAND} account`, html, url)
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<EmailResult> {
  const url = `${baseUrl()}/reset-password?token=${token}`
  const html = emailShell(
    "Reset your password",
    `<p style="margin:0 0 8px 0;color:#c9d7d0;font-size:15px;line-height:24px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0;color:#c9d7d0;font-size:15px;line-height:24px;">We received a request to reset your ${BRAND} password. This link expires in 1 hour.</p>
     ${buttonHtml(url, "Reset Password")}`
  )

  return deliver(to, `Reset your ${BRAND} password`, html, url)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/* --------------------------- Premium payment emails ------------------------ */

/**
 * Who receives payment notifications: the ADMIN_EMAIL env override first
 * (comma-separated allowed), else every ADMIN account (capped at 5).
 */
export async function getAdminRecipients(): Promise<string[]> {
  const envList = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"))
  if (envList.length > 0) return envList

  try {
    const { db } = await import("@/lib/db")
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
      take: 5,
      orderBy: { createdAt: "asc" },
    })
    return admins.map((a) => a.email)
  } catch {
    return []
  }
}

function money(amount: string, currency: string): string {
  return `${escapeHtml(amount)} ${escapeHtml(currency)}`
}

function when(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC"
}

/** Notify the site admin(s) that a premium payment landed. */
export async function sendPremiumPaymentEmail(details: {
  buyerName: string
  buyerEmail: string
  amount: string
  currency: string
  orderId: string
  payerEmail: string | null
  days: number
  premiumUntil: Date
}): Promise<void> {
  const recipients = await getAdminRecipients()
  if (recipients.length === 0) {
    console.warn("[email] no admin recipients for payment notification")
    return
  }

  const html = emailShell(
    "New premium payment received",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;width:130px;">Buyer</td>
           <td style="padding:8px 0;color:#f4faf7;font-size:14px;">${escapeHtml(details.buyerName)} &lt;${escapeHtml(details.buyerEmail)}&gt;</td></tr>
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">Amount</td>
           <td style="padding:8px 0;color:#34d399;font-size:14px;font-weight:700;">${money(details.amount, details.currency)}</td></tr>
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">Granted</td>
           <td style="padding:8px 0;color:#f4faf7;font-size:14px;">${details.days} days of Premium (active until ${when(details.premiumUntil)})</td></tr>
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">PayPal order</td>
           <td style="padding:8px 0;color:#c9d7d0;font-size:13px;font-family:monospace;">${escapeHtml(details.orderId)}</td></tr>
       ${details.payerEmail && details.payerEmail.toLowerCase() !== details.buyerEmail.toLowerCase()
         ? `<tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">PayPal account</td>
            <td style="padding:8px 0;color:#c9d7d0;font-size:13px;">${escapeHtml(details.payerEmail)}</td></tr>`
         : ""}
     </table>
     <p style="margin:20px 0 0 0;color:#7d8f86;font-size:12px;line-height:18px;">
       This notification was generated automatically after a verified PayPal capture. The full payment history is available in the admin panel.
     </p>`
  )

  for (const to of recipients) {
    await deliver(
      to,
      `New premium payment — ${details.amount} ${details.currency} from ${details.buyerEmail}`,
      html,
      `${baseUrl()}/admin`
    )
  }
}

/** Email receipt for the buyer. */
export async function sendPremiumReceiptEmail(
  to: string,
  name: string,
  details: { amount: string; currency: string; days: number; premiumUntil: Date; orderId: string }
): Promise<void> {
  const html = emailShell(
    "Your premium is active",
    `<p style="margin:0 0 8px 0;color:#c9d7d0;font-size:15px;line-height:24px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0;color:#c9d7d0;font-size:15px;line-height:24px;">
       Thank you! Your payment of <strong style="color:#34d399;">${money(details.amount, details.currency)}</strong>
       was received and <strong>FindLink Premium</strong> is now active on your account.
     </p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;width:130px;">Active until</td>
           <td style="padding:8px 0;color:#f4faf7;font-size:14px;">${when(details.premiumUntil)}</td></tr>
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">Includes</td>
           <td style="padding:8px 0;color:#c9d7d0;font-size:14px;">Unlimited trackable short links</td></tr>
       <tr><td style="padding:8px 0;color:#7d8f86;font-size:13px;">Order</td>
           <td style="padding:8px 0;color:#c9d7d0;font-size:13px;font-family:monospace;">${escapeHtml(details.orderId)}</td></tr>
     </table>
     ${buttonHtml(`${baseUrl()}/dashboard/shortlinks`, "Open dashboard")}
     <p style="margin:16px 0 0 0;color:#7d8f86;font-size:12px;line-height:18px;">
       When your premium period ends, short links keep working — you can renew from the premium page for another ${details.days} days.
     </p>`
  )

  await deliver(
    to,
    `Your ${BRAND} Premium receipt — ${details.amount} ${details.currency}`,
    html,
    `${baseUrl()}/premium`
  )
}

async function deliver(to: string, subject: string, html: string, devUrl: string): Promise<EmailResult> {
  const client = getClient()
  if (!client) {
    // Dev mode: no Resend key configured — log the link so the flow stays testable.
    console.log(`[email:dev] "${subject}" -> ${to}\n${devUrl}`)
    return { delivered: false, devUrl }
  }
  try {
    const { error } = await client.emails.send({
      from: getFrom(),
      to: [to],
      subject,
      html,
    })
    if (error) {
      console.error("[email] resend error:", error)
      return { delivered: false, error: String((error as { message?: string }).message ?? error) }
    }
    return { delivered: true }
  } catch (err) {
    console.error("[email] send failed:", err)
    return { delivered: false, error: err instanceof Error ? err.message : String(err) }
  }
}
