import type { Metadata } from "next"
import { MyLinksClient } from "@/components/dashboard/my-links-client"

export const metadata: Metadata = { title: "My listings" }

export default function MyLinksPage() {
  return <MyLinksClient />
}
