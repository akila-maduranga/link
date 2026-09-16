import type { PlatformId } from "@/data/platforms"
import { cn } from "@/lib/utils"

interface IconProps {
  className?: string
}

/**
 * Full-colour brand marks from the coloured-icons project
 * (github.com/dheereshag/coloured-icons, MIT © Dheeresh Agarwal),
 * served as cached SVGs from /icons/platforms/.
 *
 * Theme handling:
 *  - most glyphs are vividly coloured and read on light AND dark surfaces
 *  - x + tiktok have black cores → each ships a "-light" twin (white core,
 *    per the brands' own dark-background guidelines); the pair is toggled
 *    with the app's `dark` class so SSR + theme toggle both work, no JS
 *  - signal isn't in coloured-icons → keeps the inline mark below
 */
const COLOURED: Partial<Record<PlatformId, string>> = {
  telegram: "telegram",
  whatsapp: "whatsapp",
  facebook: "facebook",
  youtube: "youtube",
  discord: "discord",
  instagram: "instagram",
  reddit: "reddit",
  linkedin: "linkedin",
  snapchat: "snapchat",
  twitch: "twitch",
  pinterest: "pinterest",
}

export function PlatformIcon({ platform, className }: { platform: PlatformId | string; className?: string }) {
  switch (platform) {
    case "x":
      return (
        <>
          <img src="/icons/platforms/x.svg" alt="" aria-hidden="true" className={cn(className, "dark:hidden")} />
          <img src="/icons/platforms/x-light.svg" alt="" aria-hidden="true" className={cn(className, "hidden dark:block")} />
        </>
      )
    case "tiktok":
      return (
        <>
          <img src="/icons/platforms/tiktok.svg" alt="" aria-hidden="true" className={cn(className, "dark:hidden")} />
          <img src="/icons/platforms/tiktok-light.svg" alt="" aria-hidden="true" className={cn(className, "hidden dark:block")} />
        </>
      )
    default: {
      const file = COLOURED[platform as PlatformId]
      if (file) {
        return <img src={`/icons/platforms/${file}.svg`} alt="" aria-hidden="true" className={className} />
      }
      if (platform === "signal") return <SignalIcon className={className} />
      return <GlobeIcon className={className} />
    }
  }
}

function SignalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10c0 3.2-1.5 6-3.8 7.9L20 22h-8a10 10 0 0 1 0-20z" fill="#3A76F0" />
      <circle cx="12" cy="12" r="6" fill="#fff" />
      <path d="M12 8.5l1 2.2 2.4.3-1.7 1.7.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.7-1.7 2.4-.3 1-2.2z" fill="#3A76F0" />
    </svg>
  )
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="oklch(0.75 0.16 163)" />
      <ellipse cx="12" cy="12" rx="4.2" ry="10" stroke="#0b0e0c" strokeWidth="1.6" />
      <path d="M2.5 9.5h19M2.5 14.5h19" stroke="#0b0e0c" strokeWidth="1.6" />
    </svg>
  )
}
