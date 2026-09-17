import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { getSession } from "@/lib/auth"
import { JsonLd } from "@/components/seo/json-ld"
import {
  OG_IMAGE_PATH,
  HOME_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo"

// Google Analytics 4 (gtag.js) — override at build time with
// NEXT_PUBLIC_GA_ID=… ; unset → this site's measurement ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-R6LJCEJD24"

// Google Search Console verification token — optional. Set
// NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in .env (Search Console → "HTML tag"
// method → copy the content value) to activate; unset adds nothing.
const GSC_TOKEN = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ""

// Mobile browser behaviour: keep user zoom ENABLED (WCAG 1.4.4 — never set maximumScale<1);
// viewportFit=cover lets the app paint under notches/home-indicators on modern phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c110f" },
    { media: "(prefers-color-scheme: light)", color: "#fbfdfb" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  category: "technology",
  title: {
    // Homepage title (page.tsx defines no title of its own) — exact keyword
    // target: platforms + directory + free URL shortener.
    default: HOME_TITLE,
    template: "%s | FindLink",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "link directory",
    "community directory",
    "url shortener",
    "free url shortener",
    "link shortener with analytics",
    "click tracking",
    "telegram channel directory",
    "telegram channels",
    "whatsapp group links",
    "whatsapp groups",
    "facebook groups",
    "youtube channels",
    "discord servers",
    "shorten url",
    "link in bio",
  ],
  authors: [{ name: "FindLink" }],
  creator: "FindLink",
  publisher: "FindLink",
  formatDetection: { telephone: false },
  // Canonical for the homepage. Next.js normalizes the root to
  // https://findlink.site (no trailing slash) — for the ROOT path the empty
  // form and "/" are the same URL (RFC 3986 §6.2.3), and the sitemap emits
  // the identical form, so sitemap == canonical stays byte-consistent.
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "FindLink",
    type: "website",
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: "FindLink — free link directory & URL shortener" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  ...(GSC_TOKEN ? { verification: { google: GSC_TOKEN } } : {}),
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Session-aware shell: logged-in visitors see dashboard links from the very
  // first paint (no login/signup flash), guests see the marketing CTAs.
  // Every route is already dynamically rendered (per-request CSP nonces),
  // so reading the cookie here adds no static/dynamic conflict.
  const session = await getSession()
  const navbarUser = session
    ? {
        id: session.sub,
        name: session.name,
        email: session.email,
        role: session.role,
        emailVerified: session.verified,
        // Premium entitlement needs a DB read — the navbar client refines
        // this via /api/auth/me immediately after mount.
        isPremium: undefined,
      }
    : null

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground">
        {/* Site-wide entity structured data (server-rendered, absolute URLs) */}
        <JsonLd data={[websiteSchema(), organizationSchema()]} />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Navbar initialUser={navbarUser} />
            <main className="flex-1">{children}</main>
            <Footer authed={!!session} />
          </div>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
