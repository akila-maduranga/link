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
 *
 * Title format (the "%s | FindLink" template appends the brand):
 *   "[Platform] Directory – Find Best [Platform] Communities"
 *   e.g. "Telegram Channels & Groups Directory – Find Best Telegram Communities"
 *
 * Every meta description carries the three required elements:
 *   platform keyword + filters (category, country, language) + shortener benefit.
 *
 * Every intro paragraph is 100–150 words of unique, natural copy rendered
 * server-side BEFORE the listing grid.
 */

export interface PlatformSeo {
  /** <title> (the "%s | FindLink" template appends the brand) */
  title: string
  /** h1 on the page */
  heading: string
  /** meta description — platform + filters + shortener benefit, ≤160 chars */
  description: string
  /** meta keywords — primary + long-tail variants people actually type */
  keywords: string[]
  /** 100–150 word unique intro paragraph (renders under the h1) */
  intro: string
  /** what a single listing on this platform is called ("channel", "server"…) */
  noun: string
  /** plural form used in CTAs ("channels", "servers"…) */
  nounPlural: string
}

export const PLATFORM_SEO: Partial<Record<PlatformId, PlatformSeo>> = {
  telegram: {
    title: "Telegram Channels & Groups Directory – Find Best Telegram Communities",
    heading: "Telegram channels & groups",
    description:
      "Find the best Telegram channels and groups by category, country and language. Join active communities free — then shorten any link and track every click.",
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
      "Find Telegram channels and groups worth joining — curated from submissions around the world and filtered by category, country and language. Every listing shows a description, member count and live click stats, so you can spot the communities people actually use before you join. Browse tech channels, news feeds, movie groups, trading communities and local groups from dozens of countries, in the language you speak. Community owners can list a channel or group in minutes, get a permanent page with a short link, and watch real click analytics show where visitors come from. The directory is moderated daily — spam gets removed, great listings get featured — so what you find here is what people actually clicked. Shorten and share your own Telegram invite link with a memorable short URL and watch it grow.",
    noun: "channel",
    nounPlural: "channels",
  },
  whatsapp: {
    title: "WhatsApp Group Links Directory – Find Best WhatsApp Groups",
    heading: "WhatsApp group links",
    description:
      "Discover active WhatsApp group invite links by category, country and language — jobs, study, news and more. Free to join, plus a shortener with analytics.",
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
      "Looking for WhatsApp groups that match your interests? This directory collects public invite links to active group chats — from study circles and job boards to fan communities and local buy-and-sell groups — each tagged by category, country and language so you can find your people fast. Filter thousands of WhatsApp group links down to exactly what you want: the right topic, the right country, the right language. Every listing shows a plain-language description and live click counts, so you can see which groups are buzzing before you tap join. All links are moderated, and dead or abusive groups get removed. Group admins can submit their own WhatsApp group, get a permanent listing page with a shareable short link, and use the built-in click analytics to see which shares actually bring new members.",
    noun: "group",
    nounPlural: "groups",
  },
  facebook: {
    title: "Facebook Groups & Pages Directory – Find Best Facebook Communities",
    heading: "Facebook groups & pages",
    description:
      "Browse Facebook groups and pages by category, country and language — hobbies, local news, buy & sell and more. Free directory plus a link shortener.",
    keywords: [
      "facebook groups",
      "facebook pages",
      "facebook group directory",
      "find facebook groups",
      "join facebook group",
      "facebook community directory",
    ],
    intro:
      "Facebook is still where thousands of niche communities live — they're just hard to find through search alone. This directory gathers public Facebook groups and pages with their descriptions, member counts and countries, sorted by what's trending. Filter by category to jump straight to your interest — hobbies, local news, buy-and-sell, parenting, gaming or sports — then narrow by country and language to find groups near you. Every listing shows live click stats, so you can see which communities other visitors actually checked out. Group owners can submit a Facebook group or page and give it a short link that's easy to share beyond Facebook's walls — in chats, bios and posts — with click analytics that show exactly where each visitor came from. All listings are moderated for quality, so the directory stays worth browsing.",
    noun: "group",
    nounPlural: "groups",
  },
  youtube: {
    title: "YouTube Channels Directory – Find Best YouTube Channels",
    heading: "YouTube channels",
    description:
      "Find the best YouTube channels by category, country and language — education, tech, music, gaming and more. Free directory plus a shortener with stats.",
    keywords: [
      "youtube channels",
      "best youtube channels",
      "youtube channel directory",
      "find youtube channels",
      "youtube channel list",
      "discover youtube channels",
    ],
    intro:
      "Great YouTube channels are buried by the algorithm every day. This directory surfaces channels worth subscribing to — tagged by topic, country and language, with real click counts showing what other visitors actually checked out. Browse education channels, tech reviewers, music curators, gaming creators and documentary makers from around the world; filter by category to find your niche, by country to find creators near you, and by language to find channels you'll actually understand. Each listing shows the channel's description and live stats, so you know it's active before you subscribe. Creators can list their channel and track exactly where the audience comes from — country, device, browser and referrer on every click of a short link that works in any bio, chat or community post. Submissions are free and moderated for quality.",
    noun: "channel",
    nounPlural: "channels",
  },
  discord: {
    title: "Discord Servers Directory – Find Best Discord Communities",
    heading: "Discord servers",
    description:
      "Browse Discord servers by category, country and language — gaming, study, dev and art communities with instant invite links. Join active servers free.",
    keywords: [
      "discord servers",
      "discord server directory",
      "find discord servers",
      "join discord server",
      "discord communities",
      "discord server list",
    ],
    intro:
      "The best Discord servers grow through word of mouth, not search. This directory lists public servers with their invite links, descriptions and member counts — filterable by category, country and language so you land in the right community on the first click. Find gaming servers for your favourite title, study rooms, developer hubs, art communities and local servers in your language; each listing shows live click stats so you can see which servers people are actually joining right now. Server owners can share a clean, permanent short invite URL — perfect for bios, stream overlays and cross-platform promos — and watch join stats in real time with country, device and referrer analytics. Every listing is moderated; dead invites get refreshed or removed, so the directory stays trustworthy instead of becoming a wall of expired links.",
    noun: "server",
    nounPlural: "servers",
  },
  x: {
    title: "X (Twitter) Accounts Directory – Find Best X Communities",
    heading: "X (Twitter) accounts & communities",
    description:
      "Discover notable X (Twitter) accounts and communities by category, country and language — news, tech, sports and more, with a free link shortener.",
    keywords: [
      "x accounts",
      "twitter accounts",
      "twitter directory",
      "find twitter accounts",
      "x communities",
      "twitter list directory",
    ],
    intro:
      "Finding good accounts to follow on X is mostly luck — this directory turns it into a filterable list. Browse accounts and communities by topic, country and language, see what others actually clicked, and follow the profiles that match your interests: news breakers, tech commentators, sports analysts, meme pages and niche creators the algorithm never shows you. Each listing carries a plain description and live click counts, so you can gauge which profiles the community actually visits before you follow. Creators and brands can claim a listing, share a handle with a tracked short link, and see exactly which promos convert — with country, device and referrer analytics on every click. It's the same free directory and URL shortener that powers the rest of FindLink, applied to the X graph, and every submission is moderated.",
    noun: "account",
    nounPlural: "accounts",
  },
  instagram: {
    title: "Instagram Accounts Directory – Find Best Instagram Creators",
    heading: "Instagram accounts & creators",
    description:
      "Browse Instagram accounts, creators and pages by category, country and language — photography, food, fashion, fitness and more. Free to discover.",
    keywords: [
      "instagram accounts",
      "instagram creators",
      "instagram directory",
      "find instagram accounts",
      "instagram pages",
      "discover instagram creators",
    ],
    intro:
      "Instagram's own search only shows you the biggest accounts. This directory is where smaller and niche creators get found — tagged by category, country and language, ranked by real clicks instead of follower counts. Browse photographers, food creators, fashion pages, fitness coaches, travel accounts and local businesses; filter to your interest and see which profiles visitors actually click through to. Every listing shows a description and live stats, so you follow creators who are active, not just big. Creators get a shareable short link with full click analytics — perfect for bios, stories and cross-platform campaigns — showing country, device, browser and referrer for every visitor. Submit a profile in minutes and let the community discover it, then use the same shortener to track every campaign link shared anywhere.",
    noun: "account",
    nounPlural: "accounts",
  },
  reddit: {
    title: "Reddit Subreddits Directory – Find Best Reddit Communities",
    heading: "Reddit subreddits",
    description:
      "Find the best subreddits by category, country and language — niche communities for every interest. Free directory plus a link shortener with analytics.",
    keywords: [
      "subreddits",
      "reddit communities",
      "find subreddits",
      "subreddit directory",
      "best subreddits",
      "reddit list",
    ],
    intro:
      "There's a subreddit for everything — finding it is the hard part. This directory lists subreddits by topic, country and language with plain-language descriptions of what each community is about, so you can judge a subreddit before you subscribe. Dig through niche interests, local communities and non-English subreddits the site's own search buries; check the live click counts to see which communities visitors actually explore, and jump straight to the ones worth your time. Mods and power users can share favourite subreddits with a short link that survives any chat app, and see how many people actually click. Every submission is moderated, so the list stays clean and useful. The same free account also unlocks the URL shortener — with country, device and referrer analytics on every link you share.",
    noun: "subreddit",
    nounPlural: "subreddits",
  },
  tiktok: {
    title: "TikTok Creators Directory – Find Best TikTok Accounts",
    heading: "TikTok accounts & creators",
    description:
      "Browse TikTok creators and accounts by category, country and language — comedy, cooking, education, dance and more. Free to discover new creators.",
    keywords: [
      "tiktok accounts",
      "tiktok creators",
      "find tiktok creators",
      "tiktok directory",
      "tiktok accounts to follow",
      "discover tiktok creators",
    ],
    intro:
      "TikTok's For You page decides who you see — this directory lets you decide. Browse TikTok creators by niche, country and language, check their descriptions and see which profiles the community actually visits. Find comedy creators, cooks, educators, dancers, fitness coaches and niche hobbyists the algorithm hasn't pushed your way yet; filter by category for your interest, by country for local creators, and by language for content you'll actually understand. Every listing shows live click stats, so trending means what visitors clicked — not what an ad team paid for. Creators can list an account and get a short link that shows exactly how many clicks each cross-promo brings, with country, device and referrer analytics on every visit. Free to submit and moderated for quality, so the directory stays worth a browse.",
    noun: "account",
    nounPlural: "accounts",
  },
  linkedin: {
    title: "LinkedIn Groups & Pages Directory – Find Best LinkedIn Communities",
    heading: "LinkedIn groups & pages",
    description:
      "Find LinkedIn groups and company pages by industry, country and language — networking, job leads, industry news. Free directory plus link shortener.",
    keywords: [
      "linkedin groups",
      "linkedin pages",
      "linkedin group directory",
      "find linkedin groups",
      "professional communities",
      "linkedin networking",
    ],
    intro:
      "The most useful LinkedIn groups rarely show up in LinkedIn's own search. This directory collects professional communities and company pages with descriptions, industries and countries — filter to your field and join the conversations that matter. Find industry groups, job-lead communities, alumni networks, founder circles and company pages worth following; narrow by country and language to network where you actually live and work. Each listing shows live click counts, so you can see which professional communities other visitors take seriously. Professionals and companies can share a group or page with a short link that works in email signatures, applications and posts — and measure every campaign click with country, device and referrer analytics. All listings are moderated, so the directory stays spam-free and genuinely useful for professional networking rather than a link dump.",
    noun: "group",
    nounPlural: "groups",
  },
  snapchat: {
    title: "Snapchat Accounts Directory – Find Best Snapchat Creators",
    heading: "Snapchat accounts & creators",
    description:
      "Discover Snapchat accounts and creators by category, country and language — entertainers, publishers, brands and more. Free to browse and submit.",
    keywords: [
      "snapchat accounts",
      "snapchat creators",
      "find snapchat accounts",
      "snapchat directory",
      "snapchat users",
      "discover snapchat creators",
    ],
    intro:
      "Snapchat has no real discovery layer — creators grow entirely off-platform. This directory gives Snapchat accounts a findable home: browsable by category, country and language, with descriptions and live click counts. Find entertainers, publishers, brands, cosplayers and everyday creators worth adding; filter by interest and see which profiles the community actually clicks through to, rather than guessing. Creators get a tracked short link that finally shows which shares convert to adds — with country, device, browser and referrer analytics on every click — plus a permanent listing page to point new fans at. Free to submit and moderated daily, so the accounts listed are the ones people actually use. The same FindLink account also unlocks the URL shortener for any other link you want to share and measure.",
    noun: "account",
    nounPlural: "accounts",
  },
  twitch: {
    title: "Twitch Channels Directory – Find Best Twitch Streamers",
    heading: "Twitch channels & streamers",
    description:
      "Browse Twitch streamers and channels by category, country and language — gaming, just chatting, music, IRL and more. Free directory, join in a click.",
    keywords: [
      "twitch channels",
      "twitch streamers",
      "find twitch streamers",
      "twitch directory",
      "twitch channels to follow",
      "discover twitch streamers",
    ],
    intro:
      "Twitch's directory only surfaces streams that are live right now. This one helps you find the streamers worth following before they're on — tagged by game, category, country and language, ranked by real clicks. Browse variety streamers, speedrunners, just-chatting channels, musicians and IRL creators; filter by the games you play, then check each channel's live click stats to see who the community actually watches. Every listing links straight to the channel so you can follow, subscribe or set alerts in one click. Streamers can give a channel a short, memorable link for overlays, bios and cross-platform promos — with analytics on every click showing country, device and referrer — so they finally know which promo actually brought viewers. Free to submit, moderated for active channels.",
    noun: "channel",
    nounPlural: "channels",
  },
  pinterest: {
    title: "Pinterest Boards Directory – Find Best Pinterest Accounts",
    heading: "Pinterest boards & accounts",
    description:
      "Find the best Pinterest boards and accounts by category, country and language — home decor, recipes, style, DIY and more. Free to browse and submit.",
    keywords: [
      "pinterest boards",
      "pinterest accounts",
      "find pinterest boards",
      "pinterest directory",
      "best pinterest accounts",
      "pinterest inspiration",
    ],
    intro:
      "Pinterest is a search engine for inspiration — and the best boards are scattered across it. This directory gathers boards and accounts by topic, country and language so you can find curated ideas instead of algorithm noise. Browse home decor, recipes, wedding planning, style, DIY, gardening and travel boards; filter by category for your project, by country for local inspiration, and by language for pins you can read. Each listing shows a description and live click counts, so you can see which boards other visitors actually explored before following them. Pinners can share a short link to a board or profile — perfect for bios, newsletters and cross-platform sharing — and see exactly which shares drive traffic, with country, device and referrer analytics on every click. Free to submit and moderated for quality.",
    noun: "board",
    nounPlural: "boards",
  },
  signal: {
    title: "Signal Groups Directory – Find Best Signal Communities",
    heading: "Signal groups",
    description:
      "Browse Signal groups by category, country and language — privacy-focused communities for every interest. Find active invite links, free to join.",
    keywords: [
      "signal groups",
      "signal group links",
      "find signal groups",
      "signal directory",
      "join signal group",
      "signal communities",
    ],
    intro:
      "Signal is built for privacy — which also makes its communities invisible to normal search. This directory lists public Signal groups by category, country and language, with descriptions and live click counts, while the platform keeps your conversations end-to-end encrypted. Find privacy-conscious communities for tech, news, activism, local organising and everyday interests; filter by the topic you care about and the language you speak, then join straight from the listing. Because Signal exposes no public graph, a curated directory is the only sane way to discover its groups — every entry here was submitted by a real member and is moderated for quality. Share your own group with a short link that works anywhere — chats, forums, printed QR posters — and watch click analytics show where new members come from, without ever storing their identities.",
    noun: "group",
    nounPlural: "groups",
  },
  other: {
    title: "Community Directory – Find More Online Communities & Forums",
    heading: "More communities",
    description:
      "Discover communities from every other platform — forums, wikis, Mastodon, Threads and beyond — by category, country and language. Free to browse.",
    keywords: [
      "online communities",
      "community directory",
      "find online communities",
      "forum directory",
      "mastodon directory",
      "link directory",
    ],
    intro:
      "Not every community lives on a mega-platform. This section gathers listings from forums, wikis, fediverse instances, Substacks, Discourse boards and everything else — the same category, country and language filters, the same live click stats, the same moderation. If the platform you care about isn't big enough for its own page yet, this is where it lives: Mastodon instances, Threads communities, niche forums and everything the big directories overlook. Browse by interest and see what the community actually clicks; every listing carries a plain-language description so you know what you're joining before you join. If your platform isn't listed yet, submit it here and it gets the same short-link superpowers — a permanent page, a memorable short URL and click analytics that show exactly where visitors come from.",
    noun: "community",
    nounPlural: "communities",
  },
}
