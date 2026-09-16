import type { MetadataRoute } from "next"
import { SITE_DESCRIPTION } from "@/lib/seo"

/**
 * Served at /manifest.webmanifest — brand identity for installable
 * contexts and some search-engine entity signals.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FindLink — Link Directory & URL Shortener",
    short_name: "FindLink",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0c110f",
    theme_color: "#10b981",
    categories: ["social", "utilities", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
