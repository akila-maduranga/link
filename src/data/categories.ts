export interface Category {
  id: string
  name: string
  icon: string // lucide icon name used by the category icon mapper
}

export const CATEGORIES: Category[] = [
  { id: "technology", name: "Technology", icon: "cpu" },
  { id: "education", name: "Education", icon: "graduation-cap" },
  { id: "news", name: "News & Media", icon: "newspaper" },
  { id: "entertainment", name: "Entertainment", icon: "clapperboard" },
  { id: "gaming", name: "Gaming", icon: "gamepad-2" },
  { id: "sports", name: "Sports", icon: "trophy" },
  { id: "music", name: "Music", icon: "music" },
  { id: "movies", name: "Movies & TV", icon: "film" },
  { id: "business", name: "Business", icon: "briefcase" },
  { id: "finance", name: "Finance & Crypto", icon: "trending-up" },
  { id: "health", name: "Health", icon: "heart-pulse" },
  { id: "fitness", name: "Fitness", icon: "dumbbell" },
  { id: "food", name: "Food & Cooking", icon: "utensils" },
  { id: "travel", name: "Travel", icon: "plane" },
  { id: "fashion", name: "Fashion & Style", icon: "shirt" },
  { id: "science", name: "Science", icon: "flask-conical" },
  { id: "art", name: "Art & Design", icon: "palette" },
  { id: "photography", name: "Photography", icon: "camera" },
  { id: "automotive", name: "Automotive", icon: "car" },
  { id: "jobs", name: "Jobs & Careers", icon: "briefcase-business" },
  { id: "language", name: "Language Learning", icon: "languages" },
  { id: "books", name: "Books & Writing", icon: "book-open" },
  { id: "memes", name: "Memes & Fun", icon: "laugh" },
  { id: "spirituality", name: "Spirituality", icon: "sparkles" },
  { id: "adult", name: "18+ Adult", icon: "venetian-mask" },
  { id: "other", name: "Other", icon: "folder" },
]

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)

export function getCategory(id: string): Category {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP.other
}
