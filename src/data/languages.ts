export interface Language {
  code: string // ISO-639-1
  name: string
  native: string
}

export const LANGUAGES: Language[] = [
  { code: "multi", name: "Multilingual", native: "Multi" },
  { code: "en", name: "English", native: "English" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
]

export const LANGUAGE_MAP: Record<string, Language> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
)

export function getLanguage(code: string): Language | undefined {
  return LANGUAGE_MAP[code]
}

export function languageName(code: string | null | undefined): string {
  if (!code) return "Unknown"
  return LANGUAGE_MAP[code]?.name ?? code.toUpperCase()
}
