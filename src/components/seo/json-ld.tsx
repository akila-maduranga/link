/**
 * Renders JSON-LD structured data in the initial server-rendered HTML.
 *
 * Google's JS SEO guidance (Dec 2025): structured data injected client-side
 * may be processed with a delay — so this is a server component and the
 * payload is inlined into the first response.
 *
 * `<` is escaped to `\u003c` so user-sourced strings can never break out of
 * the <script> element.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
