import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * Served at /robots.txt (replaces the old static public/robots.txt).
 *
 * Public content (/, /explore, /explore/[platform], /link/[slug], /premium,
 * /login, /register) stays crawlable. Everything that is either private,
 * a redirect endpoint or an API is excluded so crawlers spend their budget
 * on indexable pages:
 *   /api/*         — JSON endpoints (no HTML to index)
 *   /dashboard/*   — auth-only app surface
 *   /admin         — auth-only app surface
 *   /go/*, /s/*    — click-redirect endpoints (tracked outbound links)
 *   /verify-email, /forgot-password, /reset-password — one-time token flows
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/admin",
          "/go/",
          "/s/",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
