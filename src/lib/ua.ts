export interface UAResult {
  browser: string
  os: string
  device: "desktop" | "mobile" | "tablet" | "bot"
  isBot: boolean
}

const BOT_PATTERN =
  /(bot|crawler|spider|crawling|facebookexternalhit|facebookcatalog|twitterbot|telegrambot|whatsapp|slackbot|discordbot|linkedinbot|embedly|quora link preview|outbrain|bingpreview|google-weblight|yahooseeker|pinterestbot|preview|lighthouse|headlesschrome|python-requests|curl\/|wget|axios\/|got\/|node-fetch|postmanruntime|insomnia|okhttp|apache-httpclient|go-http-client|libwww-perl|java\/)/i

export function parseUserAgent(ua: string | null | undefined): UAResult {
  const s = ua ?? ""

  if (!s || BOT_PATTERN.test(s)) {
    return { browser: s ? "Bot" : "Unknown", os: "Unknown", device: "bot", isBot: true }
  }

  /* ------------------------------- Browser -------------------------------- */
  let browser = "Other"
  if (/Edg(e|A|iOS)?\//.test(s)) browser = "Edge"
  else if (/OPR\/|Opera|Opera Mini/.test(s)) browser = "Opera"
  else if (/SamsungBrowser\//.test(s)) browser = "Samsung Internet"
  else if (/FxiOS\//.test(s)) browser = "Firefox"
  else if (/Firefox\//.test(s)) browser = "Firefox"
  else if (/CriOS\//.test(s)) browser = "Chrome"
  else if (/Chrome\//.test(s)) browser = "Chrome"
  else if (/Version\/.*Safari/.test(s)) browser = "Safari"
  else if (/MSIE |Trident\//.test(s)) browser = "Internet Explorer"
  else if (/UCBrowser\//.test(s)) browser = "UC Browser"

  /* ---------------------------------- OS ---------------------------------- */
  let os = "Other"
  if (/Windows NT/.test(s)) os = "Windows"
  else if (/iPhone|iPad|iPod/.test(s)) os = "iOS"
  else if (/Mac OS X|Macintosh/.test(s)) os = "macOS"
  else if (/Android/.test(s)) os = "Android"
  else if (/CrOS/.test(s)) os = "ChromeOS"
  else if (/Linux|X11/.test(s)) os = "Linux"

  /* -------------------------------- Device -------------------------------- */
  let device: UAResult["device"] = "desktop"
  const isTablet = /iPad|Tablet|PlayBook|Silk|Kindle/.test(s) || (/Android/.test(s) && !/Mobile/.test(s))
  if (isTablet) device = "tablet"
  else if (/Mobi|iPhone|iPod|Windows Phone|IEMobile/.test(s)) device = "mobile"

  return { browser, os, device, isBot: false }
}
