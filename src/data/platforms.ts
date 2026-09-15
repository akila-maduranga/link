export type PlatformId =
  | "telegram"
  | "whatsapp"
  | "facebook"
  | "youtube"
  | "discord"
  | "x"
  | "instagram"
  | "reddit"
  | "tiktok"
  | "linkedin"
  | "snapchat"
  | "twitch"
  | "pinterest"
  | "signal"
  | "other"

export interface Platform {
  id: PlatformId
  name: string
  color: string // brand hex
  group: "messaging" | "social" | "media" | "professional" | "other"
  label: string // e.g. "Channel / Group"
}

export const PLATFORMS: Platform[] = [
  { id: "telegram", name: "Telegram", color: "#229ED9", group: "messaging", label: "Channel / Group" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", group: "messaging", label: "Group / Channel" },
  { id: "facebook", name: "Facebook", color: "#1877F2", group: "social", label: "Group / Page" },
  { id: "youtube", name: "YouTube", color: "#FF0000", group: "media", label: "Channel" },
  { id: "discord", name: "Discord", color: "#5865F2", group: "messaging", label: "Server" },
  { id: "x", name: "X (Twitter)", color: "#e7e9ea", group: "social", label: "Profile / Community" },
  { id: "instagram", name: "Instagram", color: "#E4405F", group: "media", label: "Account" },
  { id: "reddit", name: "Reddit", color: "#FF4500", group: "social", label: "Subreddit" },
  { id: "tiktok", name: "TikTok", color: "#00F2EA", group: "media", label: "Account" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", group: "professional", label: "Group / Page" },
  { id: "snapchat", name: "Snapchat", color: "#FFFC00", group: "social", label: "Account" },
  { id: "twitch", name: "Twitch", color: "#9146FF", group: "media", label: "Channel" },
  { id: "pinterest", name: "Pinterest", color: "#BD081C", group: "media", label: "Board" },
  { id: "signal", name: "Signal", color: "#3A76F0", group: "messaging", label: "Group" },
  { id: "other", name: "Other", color: "#8b8b8b", group: "other", label: "Community" },
]

export const PLATFORM_MAP: Record<string, Platform> = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
)

export function getPlatform(id: string): Platform {
  return PLATFORM_MAP[id] ?? PLATFORM_MAP.other
}
