import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

const appUrl = process.env.APP_URL || "https://findlink.site"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
