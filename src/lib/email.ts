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
