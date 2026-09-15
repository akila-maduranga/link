import { z } from "zod"
import { PLATFORMS } from "@/data/platforms"
import { CATEGORIES } from "@/data/categories"
import { COUNTRIES } from "@/data/countries"
import { LANGUAGES } from "@/data/languages"
import { emailDomainError, getAllowedEmailDomains, isAllowedEmail } from "@/lib/email-domains"

const PLATFORM_IDS = PLATFORMS.map((p) => p.id) as [string, ...string[]]
const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]]
const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]]
const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [string, ...string[]]

/** Only http(s) URLs are accepted — blocks javascript:, data: and other schemes. */
export const safeHttpUrl = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  }, "Enter a valid URL starting with http:// or https://")

const REGISTER_ALLOWED_DOMAINS = getAllowedEmailDomains()

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254)
    .refine(
      (value) => isAllowedEmail(value, REGISTER_ALLOWED_DOMAINS),
      emailDomainError(REGISTER_ALLOWED_DOMAINS) || "Email domain not allowed"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
})

export const linkSubmitSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80, "Title is too long"),
  url: safeHttpUrl,
  description: z.string().trim().max(500, "Description must be under 500 characters").optional().or(z.literal("")),
  platform: z.enum(PLATFORM_IDS),
  category: z.enum(CATEGORY_IDS),
  country: z.enum(COUNTRY_CODES),
  language: z.enum(LANGUAGE_CODES),
  members: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9.,kKmMbB+\- ]*$/, "Use a short form like 12.5K or 1.2M")
    .optional()
    .or(z.literal("")),
})

export const shortLinkCreateSchema = z.object({
  destination: safeHttpUrl,
  title: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  customSlug: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{3,32}$/, "3-32 characters: letters, numbers, - and _ only")
    .optional()
    .or(z.literal("")),
})

export const shortLinkUpdateSchema = z.object({
  title: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
  destination: safeHttpUrl.optional(),
})

export type LinkSubmitInput = z.infer<typeof linkSubmitSchema>
export type ShortLinkCreateInput = z.infer<typeof shortLinkCreateSchema>
