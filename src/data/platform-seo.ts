import type { PlatformId } from "@/data/platforms"

/**
 * Per-platform SEO copy for the /explore/[platform] directory landing pages.
 *
 * Programmatic-SEO quality gates (Agentic-SEO-Skill "seo-sitemap" /
 * "seo-programmatic" references) applied:
 *   - 15 pages, each with unique title / description / keywords / intro copy
 *     (well under the 30-page "60% unique content" warning threshold)
 *   - listings themselves differ per platform (data-driven uniqueness)
 *   - platform-specific vocabulary (channels vs groups vs servers vs
 *     subreddits vs boards) instead of swapped city/placeholders
 */

export interface PlatformSeo {
  /** <title> (the "%s · FindLink" template appends the brand) */
  title: string
  /** h1 on the page */
  heading: string
  /** meta description — includes the keyword phrase + a value promise */
  description: string
  /** meta keywords — primary + long-tail variants people actually type */
  keywords: string[]
  /** 2–3 sentence unique intro paragraph (renders under the h1) */
  intro: string
  /** what a single listing on this platform is called ("channel", "server"…) */
  noun: string
  /** plural form used in CTAs ("channels", "servers"…) */
  nounPlural: string
}

export const PLATFORM_SEO: Partial<Record<PlatformId, PlatformSeo>> = {
  telegram: {
    title: "Telegram Channels & Groups Directory — Find & Join Communities",
    heading: "Telegram channels & groups",
    description:
      "Browse the best Telegram channels and groups by category, country and language. Find active Telegram communities with member counts and descriptions — join directly from a free, moderated directory.",
    keywords: [
      "telegram channels",
      "telegram groups",
      "telegram channel directory",
      "find telegram channels",
      "join telegram groups",
      "best telegram channels",
      "telegram channel list",
    ],
    intro:
      "Find Telegram channels and groups worth joining — curated from submissions around the world and filtered by category, country and language. Every listing shows a description, member count and live click stats, so you can spot the communities people actually use before you join. Shorten and share your own Telegram invite link with a memorable short URL and watch it grow.",
    noun: "channel",
    nounPlural: "channels",
  },
  whatsapp: {
    title: "WhatsApp Group Links Directory — Find & Join Active Groups",
    heading: "WhatsApp group links",
    description:
      "Discover active WhatsApp groups with invite links, sorted by category, country and language. Find group chats for news, jobs, study, entertainment and more — free, moderated and joinable in one click.",
    keywords: [
      "whatsapp group links",
      "whatsapp groups",
      "join whatsapp group",
      "whatsapp group directory",
      "active whatsapp group links",
      "whatsapp group chat",
      "find whatsapp groups",
    ],
    intro:
      "Looking for WhatsApp groups that match your interests? This directory collects public invite links to active group chats — from study circles and job boards to fan communities — each tagged by category, country and language so you can find your people fast. Every link is moderated, and each listing shows live click counts so you can see which groups are buzzing.",
    noun: "group",
    nounPlural: "groups",
  },
  facebook: {
    title: "Facebook Groups & Pages Directory — Discover Communities",
    heading: "Facebook groups & pages",
    description:
      "Browse Facebook groups and pages by category, country and language. Discover active communities for hobbies, local news, buy & sell and more — with descriptions, member counts and direct join links.",
    keywords: [
      "facebook groups",
      "facebook pages",
      "facebook group directory",
      "find facebook groups",
      "join facebook group",
      "facebook community directory",
    ],
    intro:
      "Facebook is still where thousands of niche communities live — they're just hard to find through search alone. This directory gathers public Facebook groups and pages with their descriptions, member counts and countries, sorted by what's trending. Submit your own group and give it a short link that's easy to share beyond Facebook's walls.",
    noun: "group",
    nounPlural: "groups",
  },
  youtube: {
    title: "YouTube Channels Directory — Discover the Best Channels",
    heading: "YouTube channels",
    description:
      "Find the best YouTube channels by category, country and language — from education and tech reviews to music and entertainment. A moderated channel directory with live click stats and join links.",
    keywords: [
      "youtube channels",
      "best youtube channels",
      "youtube channel directory",
      "find youtube channels",
      "youtube channel list",
      "discover youtube channels",
    ],
    intro:
      "Great YouTube channels are buried by the algorithm every day. This directory surfaces channels worth subscribing to — tagged by topic, country and language, with real click counts showing what other visitors actually checked out. Creators: list your channel and track exactly where your audience comes from with per-click analytics.",
    noun: "channel",
    nounPlural: "channels",
  },
  discord: {
    title: "Discord Servers Directory — Find & Join Communities",
    heading: "Discord servers",
    description:
      "Browse Discord servers by category, country and language — gaming, study, dev communities and more. Find active Discord communities with member counts and instant invite links.",
    keywords: [
      "discord servers",
      "discord server directory",
      "find discord servers",
      "join discord server",
      "discord communities",
      "discord server list",
    ],
    intro:
      "The best Discord servers grow through word of mouth, not search. This directory lists public servers with their invite links, descriptions and member counts — filterable by category, country and language so you land in the right community on the first click. Server owners can share a clean short invite URL and watch their join stats in real time.",
    noun: "server",
    nounPlural: "servers",
  },
  x: {
    title: "X (Twitter) Accounts & Communities Directory",
    heading: "X (Twitter) accounts & communities",
    description:
      "Discover notable X (Twitter) accounts and communities by category, country and language — news, tech, sports and more. A moderated directory with live click stats on every profile link.",
    keywords: [
      "x accounts",
      "twitter accounts",
      "twitter directory",
      "find twitter accounts",
      "x communities",
      "twitter list directory",
    ],
    intro:
      "Finding good accounts to follow on X is mostly luck — this directory turns it into a filterable list. Browse accounts and communities by topic, country and language, see what others actually clicked, and follow the profiles that match your interests. Share your own handle with a tracked short link to see which promos convert.",
    noun: "account",
    nounPlural: "accounts",
  },
  instagram: {
    title: "Instagram Accounts Directory — Discover Creators & Pages",
    heading: "Instagram accounts & creators",
    description:
      "Browse Instagram accounts, creators and pages by category, country and language — photography, food, fashion, fitness and more. Discover profiles with live click stats on every link.",
    keywords: [
      "instagram accounts",
      "instagram creators",
      "instagram directory",
      "find instagram accounts",
      "instagram pages",
      "discover instagram creators",
    ],
    intro:
      "Instagram's own search only shows you the biggest accounts. This directory is where smaller and niche creators get found — tagged by category, country and language, ranked by real clicks instead of follower counts. Creators get a shareable short link with full click analytics to measure every campaign.",
    noun: "account",
    nounPlural: "accounts",
  },
  reddit: {
    title: "Reddit Subreddit Directory — Find Communities by Topic",
    heading: "Reddit subreddits",
    description:
      "Find the best subreddits by category, country and language — niche communities for every interest. A moderated subreddit directory with descriptions and live click stats.",
    keywords: [
      "subreddits",
      "reddit communities",
      "find subreddits",
      "subreddit directory",
      "best subreddits",
      "reddit list",
    ],
    intro:
      "There's a subreddit for everything — finding it is the hard part. This directory lists subreddits by topic, country and language with plain-language descriptions of what each community is about. See which communities visitors actually click through to, and share your favourite with a short link that survives any chat app.",
    noun: "subreddit",
    nounPlural: "subreddits",
  },
  tiktok: {
    title: "TikTok Accounts & Creators Directory — Discover Creators",
    heading: "TikTok accounts & creators",
    description:
      "Browse TikTok creators and accounts by category, country and language — comedy, cooking, education, dance and more. Discover the creators worth following, with live click stats.",
    keywords: [
      "tiktok accounts",
      "tiktok creators",
      "find tiktok creators",
      "tiktok directory",
      "tiktok accounts to follow",
      "discover tiktok creators",
    ],
    intro:
      "TikTok's For You page decides who you see — this directory lets you decide. Browse TikTok creators by niche, country and language, check their descriptions and see which profiles the community actually visits. Creators: list your account and get a short link that shows exactly how many clicks each cross-promo brings.",
    noun: "account",
    nounPlural: "accounts",
  },
  linkedin: {
    title: "LinkedIn Groups & Pages Directory — Professional Communities",
    heading: "LinkedIn groups & pages",
    description:
      "Find LinkedIn groups and company pages by industry, country and language — professional networking, job leads, industry news and more. A moderated directory with live click stats.",
    keywords: [
      "linkedin groups",
      "linkedin pages",
      "linkedin group directory",
      "find linkedin groups",
      "professional communities",
      "linkedin networking",
    ],
    intro:
      "The most useful LinkedIn groups rarely show up in LinkedIn's own search. This directory collects professional communities and company pages with descriptions, industries and countries — filter to your field and join the conversations that matter. Share your company page with a short link and measure every campaign click.",
    noun: "group",
    nounPlural: "groups",
  },
  snapchat: {
    title: "Snapchat Accounts & Creators Directory",
    heading: "Snapchat accounts & creators",
    description:
      "Discover Snapchat accounts and creators by category, country and language — entertainers, publishers, brands and more. A moderated directory with live click stats on every profile.",
    keywords: [
      "snapchat accounts",
      "snapchat creators",
      "find snapchat accounts",
      "snapchat directory",
      "snapchat users",
      "discover snapchat creators",
    ],
    intro:
      "Snapchat has no real discovery layer — creators grow entirely off-platform. This directory gives Snapchat accounts a findable home: browsable by category, country and language, with descriptions and live click counts. Creators get a tracked short link that finally shows which shares actually convert to adds.",
    noun: "account",
    nounPlural: "accounts",
  },
  twitch: {
    title: "Twitch Channels & Streamers Directory",
    heading: "Twitch channels & streamers",
    description:
      "Browse Twitch streamers and channels by category, country and language — gaming, just chatting, music, IRL and more. Discover streamers worth following, with live click stats.",
    keywords: [
      "twitch channels",
      "twitch streamers",
      "find twitch streamers",
      "twitch directory",
      "twitch channels to follow",
      "discover twitch streamers",
    ],
    intro:
      "Twitch's directory only surfaces streams that are live right now. This one helps you find the streamers worth following before they're on — tagged by game, category, country and language, ranked by real clicks. Streamers: give your channel a short, memorable link for overlays, bios and cross-platform promos — with analytics on every click.",
    noun: "channel",
    nounPlural: "channels",
  },
  pinterest: {
    title: "Pinterest Boards & Accounts Directory — Find Inspiration",
    heading: "Pinterest boards & accounts",
    description:
      "Find the best Pinterest boards and accounts by category, country and language — home decor, recipes, style, DIY and more. A moderated directory with live click stats.",
    keywords: [
      "pinterest boards",
      "pinterest accounts",
      "find pinterest boards",
      "pinterest directory",
      "best pinterest accounts",
      "pinterest inspiration",
    ],
    intro:
      "Pinterest is a search engine for inspiration — and the best boards are scattered across it. This directory gathers boards and accounts by topic, country and language so you can find curated ideas instead of algorithm noise. Pinners can share a short link to their board and see exactly which shares drive traffic.",
    noun: "board",
    nounPlural: "boards",
  },
  signal: {
    title: "Signal Groups Directory — Find & Join Communities",
    heading: "Signal groups",
    description:
      "Browse Signal groups by category, country and language — privacy-focused communities for every interest. Find active Signal group invite links in a free, moderated directory.",
    keywords: [
      "signal groups",
      "signal group links",
      "find signal groups",
      "signal directory",
      "join signal group",
      "signal communities",
    ],
    intro:
      "Signal is built for privacy — which also makes its communities invisible to normal search. This directory lists public Signal groups by category, country and language, with descriptions and live click counts, while the platform keeps your conversations end-to-end encrypted. Share your own group with a short link that works anywhere.",
    noun: "group",
    nounPlural: "groups",
  },
  other: {
    title: "More Communities — Every Other Platform in One Directory",
    heading: "More communities",
    description:
      "Discover communities from every other platform — forums, wikis, Mastodon, Threads and beyond — sorted by category, country and language in one free, moderated directory.",
    keywords: [
      "online communities",
      "community directory",
      "find online communities",
      "forum directory",
      "mastodon directory",
      "link directory",
    ],
    intro:
      "Not every community lives on a mega-platform. This section gathers listings from forums, wikis, fediverse instances and everything else — the same category, country and language filters, the same live click stats. If your platform isn't listed yet, submit it here and it gets the same short-link superpowers.",
    noun: "community",
    nounPlural: "communities",
  },
}
