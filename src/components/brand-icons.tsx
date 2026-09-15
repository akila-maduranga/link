import type { PlatformId } from "@/data/platforms"

interface IconProps {
  className?: string
}

/** Hand-crafted simplified brand marks (24x24 viewBox) — crisp at badge sizes. */
export function PlatformIcon({ platform, className }: { platform: PlatformId | string; className?: string }) {
  switch (platform) {
    case "telegram":
      return <TelegramIcon className={className} />
    case "whatsapp":
      return <WhatsappIcon className={className} />
    case "facebook":
      return <FacebookIcon className={className} />
    case "youtube":
      return <YoutubeIcon className={className} />
    case "discord":
      return <DiscordIcon className={className} />
    case "x":
      return <XIcon className={className} />
    case "instagram":
      return <InstagramIcon className={className} />
    case "reddit":
      return <RedditIcon className={className} />
    case "tiktok":
      return <TiktokIcon className={className} />
    case "linkedin":
      return <LinkedinIcon className={className} />
    case "snapchat":
      return <SnapchatIcon className={className} />
    case "twitch":
      return <TwitchIcon className={className} />
    case "pinterest":
      return <PinterestIcon className={className} />
    case "signal":
      return <SignalIcon className={className} />
    default:
      return <GlobeIcon className={className} />
  }
}

function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#229ED9" />
      <path
        d="M5.5 11.5c3.2-1.4 6.5-2.7 9.7-4.1.6-.2 1.4.1 1.2 1.1-.3 1.8-.8 4.4-1.2 6.2-.2.9-1.2 1.1-1.9.6l-2.3-1.7c-.3-.2-.3-.6-.1-.9l2-1.9c.5-.5-.1-1.2-.7-.8l-3.3 2.2c-.5.3-1 .4-1.6.2l-1.5-.5c-.6-.2-.6-1.1-.3-1.4z"
        fill="#fff"
      />
    </svg>
  )
}

function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2a10 10 0 0 0-8.65 15.02L2 22l5.13-1.32A10 10 0 1 0 12 2z"
        fill="#25D366"
      />
      <path
        d="M9.3 7.6c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.4l.8 1.8c.1.3.1.5-.1.7l-.5.6c-.1.2-.2.3-.1.5.2.4.9 1.5 1.9 2.1 1.2.8 1.6.9 1.9.8l.8-.4c.3-.1.5-.1.7.1l1.2 1.4c.2.3.1.7-.2.9-.9.5-1.9.7-2.8.4-1.9-.6-4.5-2.3-5.7-4.7-.6-1.2-.6-2.4-.4-3.2.1-.4.2-.6.2-.6z"
        fill="#fff"
      />
    </svg>
  )
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        d="M15.5 12.5h-2.2v6.5h-2.9v-6.5H8.8v-2.4h1.6v-1.5c0-1.9 1-3.1 3-3.1h2.2v2.4h-1.2c-.7 0-.9.3-.9 1v1.2h2.4l-.4 2.4z"
        fill="#fff"
      />
    </svg>
  )
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="#FF0000" />
      <path d="M10 8.5l6.5 3.5L10 15.5V8.5z" fill="#fff" />
    </svg>
  )
}

function DiscordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M19.3 5.4A16.4 16.4 0 0 0 15.4 4.2l-.3.6c1.3.3 2.5.8 3.6 1.5a15.9 15.9 0 0 0-10.6 0c1.1-.7 2.3-1.2 3.6-1.5l-.3-.6c-1.4.2-2.7.6-3.9 1.2C4.6 9 3.7 13 4 16.9a16.5 16.5 0 0 0 5 2.5l.6-1a10 10 0 0 1-1.6-.8l.4-.3a11.7 11.7 0 0 0 10 0l.4.3c-.5.3-1 .6-1.6.8l.6 1c1.9-.6 3.6-1.4 5-2.5.4-4.6-.8-8.6-2.9-11.5h-.6zM9.3 14.7c-1 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.8 2-1.7 2zm5.4 0c-1 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.8 2-1.7 2z"
        fill="#5865F2"
      />
    </svg>
  )
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
      <path
        d="M6 6l4.8 6.3L6.3 18h2.4l3.4-4.2 3.1 4.2H18l-5-6.9L17.4 6H15l-3 3.8L9.2 6H6z"
        fill="#fff"
      />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="url(#ig)" />
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="#E4405F" fillOpacity="0.9" />
      <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.3" fill="#fff" />
      <defs>
        <linearGradient id="ig" x1="2" y1="22" x2="22" y2="2">
          <stop stopColor="#FEDA75" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function RedditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="9.5" fill="#FF4500" />
      <path
        d="M9 12.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm6 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"
        fill="#fff"
      />
      <path
        d="M8.6 16.3c1 .8 2.2 1.1 3.4 1.1s2.4-.3 3.4-1.1"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 4.2l1 2.4" stroke="#FF4500" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="13.4" cy="5.6" r="1.6" fill="#FF4500" />
    </svg>
  )
}

function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M15.8 2.5c.4 2.4 2.1 4 4.5 4.2v3.1c-1.8 0-3.4-.6-4.5-1.5v6.7c0 3.7-2.6 6-5.9 6-3 0-5.6-2.3-5.6-5.8 0-3.6 2.9-6 6.2-5.6v3.3c-1.6-.5-3 .6-3 2.3 0 1.5 1.1 2.5 2.4 2.5 1.5 0 2.6-1.1 2.6-3V2.5h3.3z"
        fill="#00F2EA"
      />
      <path
        d="M16.9 3.6c.5 2.2 2 3.6 4.2 3.8v1.5c-1.6 0-3-.5-4.2-1.4"
        fill="#fff"
      />
      <path
        d="M15.8 2.5c.4 2.4 2.1 4 4.5 4.2v3.1c-1.8 0-3.4-.6-4.5-1.5v6.7c0 3.7-2.6 6-5.9 6-3 0-5.6-2.3-5.6-5.8 0-3.6 2.9-6 6.2-5.6v3.3c-1.6-.5-3 .6-3 2.3 0 1.5 1.1 2.5 2.4 2.5 1.5 0 2.6-1.1 2.6-3V2.5h3.3z"
        fill="#fff"
        fillOpacity="0.35"
      />
      <path
        d="M17.2 3.3c.6 2.2 2.2 3.6 4.4 3.8v.8c-1.9-.1-3.4-.8-4.4-1.9"
        fill="#FE2C55"
      />
    </svg>
  )
}

function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="#0A66C2" />
      <rect x="5.5" y="10" width="2.6" height="8.5" rx="1" fill="#fff" />
      <circle cx="6.8" cy="7" r="1.6" fill="#fff" />
      <path
        d="M11 10h2.5v1.3c.5-.9 1.5-1.5 2.7-1.5 2.1 0 3.3 1.3 3.3 4v4.7h-2.6v-4.3c0-1.4-.5-2.1-1.6-2.1-1 0-1.7.7-1.7 2.1v4.3H11V10z"
        fill="#fff"
      />
    </svg>
  )
}

function SnapchatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5c2.8 0 4.7 2 4.7 4.8v1.6c.4-.2 1-.3 1.4-.1.6.2.9.8.6 1.4-.2.5-.8.9-1.7 1.2 1.1 1.6 2.6 2.5 4 2.9.5.1.7.6.5 1-.3.7-1.4 1.2-2.6 1.5-.2.6-.4 1.3-.8 1.5-.8.5-1.8-.1-3 .1-1 .2-1.6 1-3.1 1s-2.1-.8-3.1-1c-1.2-.2-2.2.4-3-.1-.4-.2-.6-.9-.8-1.5-1.2-.3-2.3-.8-2.6-1.5-.2-.4 0-.9.5-1 1.4-.4 2.9-1.3 4-2.9-.9-.3-1.5-.7-1.7-1.2-.3-.6 0-1.2.6-1.4.4-.2 1 0 1.4.1V7.3c0-2.8 1.9-4.8 4.7-4.8z"
        fill="#FFFC00"
        stroke="#00000022"
      />
    </svg>
  )
}

function TwitchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 2.5h16v13l-5 5h-3l-2.5 2.5H7V20.5H3.5L2 17V2.5h2z" fill="#9146FF" />
      <path d="M4.5 4.5v11h3v3h2.5l2.5-3h3.5l2-2v-9h-13.5z" fill="#fff" fillOpacity="0" />
      <rect x="10" y="8" width="2" height="5" fill="#fff" />
      <rect x="14.5" y="8" width="2" height="5" fill="#fff" />
    </svg>
  )
}

function PinterestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#BD081C" />
      <path
        d="M8 18.5l1.8-5.4c-.4-.7-.5-1.4-.4-2.1.3-2.2 2-3.7 4.1-3.5 1.9.2 3.2 1.7 3 3.9-.3 2.4-1.7 4-3.4 4-1 0-1.7-.7-1.5-1.7.1-.7.5-1.5.7-2.2.1-.5-.2-1-.8-.9-.9.1-1.5 1.1-1.5 2.3 0 .7.1 1.2.1 1.2L8 18.5z"
        fill="#fff"
      />
    </svg>
  )
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
