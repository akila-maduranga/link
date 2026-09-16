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

const appUrl = process.env.APP_URL || "https://findlink.site"

// Google Analytics 4 (gtag.js) — override at build time with
// NEXT_PUBLIC_GA_ID=… ; unset → this site's measurement ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-R6LJCEJD24"

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
  metadataBase: new URL(appUrl),
  title: {
    default: "FindLink — Find, Share & Shorten Links",
    template: "%s · FindLink",
  },
  description:
    "Find and share the best Telegram channels, WhatsApp groups, Facebook pages and more — filtered by category, country and language. Shorten any URL and track every click with detailed analytics.",
  keywords: ["findlink", "link directory", "url shortener", "telegram channels", "whatsapp groups", "facebook groups", "link sharing", "click analytics"],
  authors: [{ name: "FindLink" }],
  openGraph: {
    title: "FindLink — Find, Share & Shorten Links",
    description:
      "The open directory for social communities with a powerful, analytics-driven URL shortener.",
    siteName: "FindLink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FindLink — Find, Share & Shorten Links",
    description: "Discover and share communities. Shorten links. Track everything.",
  },
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
