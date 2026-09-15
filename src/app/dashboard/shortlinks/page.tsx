import type { Metadata } from "next"
import { ShortLinksClient } from "@/components/dashboard/shortlinks-client"

export const metadata: Metadata = { title: "Short links" }

export default function ShortLinksPage() {
  return <ShortLinksClient />
}
