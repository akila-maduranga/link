import type { Metadata } from "next"
import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

// 404s must never enter the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-7 w-7" />
      </span>
      <p className="mt-6 font-mono text-sm font-semibold tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        This page went exploring
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        The page you&apos;re looking for doesn&apos;t exist — it may have been moved,
        deleted, or the link that brought you here is outdated.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-xl px-8 font-semibold">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl px-8">
          <Link href="/explore">Browse the directory</Link>
        </Button>
      </div>
    </div>
  )
}
