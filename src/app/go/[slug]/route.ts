import { after } from "next/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { safeExternalUrl } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function notFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Link not found</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0e0c;color:#e8f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;}
  .card{max-width:420px;text-align:center;background:#131815;border:1px solid #233029;border-radius:16px;padding:48px 32px;}
  .badge{display:inline-block;background:rgba(16,185,129,.15);color:#34d399;font-weight:700;font-size:13px;letter-spacing:1px;padding:6px 14px;border-radius:8px;margin-bottom:24px;}
  h1{margin:0 0 12px;font-size:22px;}
  p{margin:0 0 28px;color:#9fb3a9;font-size:15px;line-height:24px;}
  a{display:inline-block;background:#10b981;color:#06251b;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px;}
</style>
</head>
<body>
  <div class="card">
    <span class="badge">FINDLINK</span>
    <h1>This link doesn't exist</h1>
    <p>The listing may have been removed. Browse the directory to find similar communities.</p>
    <a href="/explore">Browse Directory</a>
  </div>
</body>
</html>`
}

/** GET /go/:slug — tracked click-through for directory links. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const clean = decodeURIComponent(slug).slice(0, 64)

  if (!/^[a-zA-Z0-9-]{1,64}$/.test(clean)) {
    return new Response(notFoundPage(), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } })
  }

  const link = await db.link.findFirst({
    where: { slug: clean, status: "ACTIVE" },
    select: { id: true, url: true },
  })

  if (!link) {
    return new Response(notFoundPage(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    })
  }

  // OWASP unvalidated-redirect guard: only absolute http(s) destinations,
  // re-checked at redirect time (protects against legacy/edited DB rows).
  const destination = safeExternalUrl(link.url)
  if (!destination) {
    return new Response(notFoundPage(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    })
  }

  const ip = clientIp(request)
  if (rateLimit(`go:${clean}:${ip}`, 60, 60 * 1000).ok) {
    after(async () => {
      try {
        await db.link.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } },
        })
      } catch (err) {
        console.error("[go] failed to record click:", err)
      }
    })
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, follow",
    },
  })
}
