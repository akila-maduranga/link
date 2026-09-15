import Link from "next/link"

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-7 w-7" : "h-8 w-8"
  const title = size === "lg" ? "text-xl" : size === "sm" ? "text-base" : "text-lg"
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="FindLink home">
      <span className={`${dims} relative flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold glow transition-transform group-hover:scale-105`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" aria-hidden="true">
          {/* magnifier lens */}
          <circle cx="10.5" cy="10.5" r="7.2" stroke="currentColor" strokeWidth="2.1" />
          {/* handle */}
          <path d="M15.8 15.8 21 21" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          {/* chain link found inside the lens */}
          <g
            transform="translate(4.7 4.7) scale(0.483)"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </g>
        </svg>
      </span>
      <span className={`${title} font-bold tracking-tight`}>
        Find<span className="text-primary">Link</span>
      </span>
    </Link>
  )
}
