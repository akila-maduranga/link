import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { PLATFORMS } from "@/data/platforms"
import { SITE_URL } from "@/lib/seo"

/**
 * Served at /sitemap.xml — generated per request so newly approved listings
 * appear immediately (the whole app is force-dynamic for CSP nonces anyway,
 * and the underlying query is a single indexed scan).
 *
 * Format rules (sitemaps.org + Google's current guidance):
 *   - <loc> + <lastmod> only — <priority> and <changefreq> are ignored by
 *     Google, so they are deliberately omitted.
 *   - lastmod is only emitted where we KNOW the real modification time
 *     (a listing's updatedAt / latest listing on a platform) — never faked
 *     with "now" everywhere, which crawlers treat as noise.
 *   - HTTPS absolute URLs only; no redirects, no noindex'd URLs.
 *   - Well under the 50,000-URL single-file limit; no sitemap index needed.
 */
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    // No trailing slash on the root — matches the canonical tag Next.js
    // emits for "/" (https://findlink.site), keeping sitemap == canonical.
    { url: SITE_URL },
    { url: `${SITE_URL}/explore` },
    { url: `${SITE_URL}/premium` },
    { url: `${SITE_URL}/login` },
    { url: `${SITE_URL}/register` },
  ]

  try {
    // Platform directory pages (/explore/telegram, /explore/whatsapp, …).
    // lastmod = that platform's most recently updated ACTIVE listing.
    const [latestPerPlatform, links] = await Promise.all([
      db.link.groupBy({
        by: ["platform"],
        where: { status: "ACTIVE" },
        _max: { updatedAt: true },
      }),
      db.link.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ])

    const lastmodByPlatform = new Map(
      latestPerPlatform.map((g) => [g.platform, g._max.updatedAt ?? undefined]),
    )

    for (const p of PLATFORMS) {
      entries.push({
        url: `${SITE_URL}/explore/${p.id}`,
        lastModified: lastmodByPlatform.get(p.id),
      })
    }

    // One URL per active directory listing — the site's core indexable content.
    for (const l of links) {
      entries.push({
        url: `${SITE_URL}/link/${l.slug}`,
        lastModified: l.updatedAt,
      })
    }
  } catch (err) {
    // DB unavailable (e.g. cold start): still emit the static section —
    // a partial sitemap is better than a 500 that would drop robots.txt's
    // reference target.
    console.error("[sitemap] directory read failed:", err)
  }

  return entries
}
