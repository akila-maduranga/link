"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Crown, Loader2, ShieldCheck, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/* --------------------------------- types ---------------------------------- */

interface PayPalConfig {
  enabled: boolean
  clientId: string | null
  mode: string
  price: string
  currency: string
  days: number
  freeTrackableLimit: number
}

interface Me {
  user: {
    id: string
    name: string
    email: string
    role: string
    emailVerified: boolean
    isPremium: boolean
    premiumUntil: string | null
    trackableUsed: number
    trackableLimit: number | null
  } | null
}

interface PayPalButtonsOptions {
  style?: Record<string, string | number>
  createOrder: () => Promise<string>
  onApprove: (data: { orderID: string }) => Promise<void>
  onCancel?: () => void
  onError?: (err: unknown) => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonsOptions) => {
        render: (target: HTMLElement | string) => Promise<void>
        close?: () => Promise<void>
      }
    }
    gtag?: (...args: unknown[]) => void
  }
}

/* ----------------------------- SDK script load ----------------------------- */

/**
 * Module-level SDK load state — ONE injection per browser page, shared across
 * SPA remounts of this component. Three silent-failure classes are handled:
 *
 *  1. A script tag that FAILED earlier must not poison later attempts: the
 *     tag is removed and the cache reset, so the next visit (or the Retry
 *     button) injects a fresh one. (The previous implementation attached
 *     load/error listeners to an already-finished tag — events that never
 *     fire — leaving the checkout stuck on "Loading…" forever.)
 *  2. HTTP 200 with no window.paypal.Buttons (bad client id, or a client id
 *     from the wrong PAYPAL_MODE) is an ERROR, not "ready" — it used to
 *     leave a permanently empty button area with no message.
 *  3. If the SDK is somehow already on the page, never inject a second copy
 *     (loading the PayPal SDK twice breaks it).
 */
let sdkLoadPromise: Promise<void> | null = null

function loadPayPalSdk(clientId: string, currency: string, mode: string): Promise<void> {
  if (typeof window.paypal?.Buttons === "function") return Promise.resolve()
  if (sdkLoadPromise) return sdkLoadPromise

  const host = mode === "sandbox" ? "https://www.sandbox.paypal.com" : "https://www.paypal.com"
  const src = `${host}/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    // Always start from a clean slate (removes tags left by failed attempts)
    document.querySelector('script[data-paypal-sdk="1"]')?.remove()

    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.dataset.paypalSdk = "1"
    script.addEventListener("load", () => {
      if (typeof window.paypal?.Buttons === "function") {
        script.dataset.loaded = "1"
        resolve()
        return
      }
      // 200 OK but the SDK did not boot — bad client id / mode mismatch.
      // (Admin diagnostic: the PayPal client id must match the configured
      // mode — sandbox credentials only work in sandbox mode. End users get
      // a plain message; details belong in server logs, not the UI.)
      script.remove()
      reject(
        new Error(
          "PayPal checkout failed to initialize. This is a server configuration issue — please try again later."
        )
      )
    })
    script.addEventListener("error", () => {
      script.remove()
      reject(new Error("Could not download the PayPal checkout script — check your connection."))
    })
    document.head.appendChild(script)
  })

  // A failed load must not poison the next attempt — clear the shared cache.
  void sdkLoadPromise.catch(() => {
    sdkLoadPromise = null
  })
  return sdkLoadPromise
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

/* -------------------------------- component ------------------------------- */

type Phase = "loading" | "ready" | "not-configured" | "sdk-error"

export function PremiumClient() {
  const [config, setConfig] = useState<PayPalConfig | null>(null)
  const [me, setMe] = useState<Me["user"]>(null)
  const [meLoaded, setMeLoaded] = useState(false)
  const [phase, setPhase] = useState<Phase>("loading")
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const buttonsRef = useRef<HTMLDivElement | null>(null)

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = (await res.json()) as Me
      setMe(data.user)
    } catch {
      setMe(null)
    } finally {
      setMeLoaded(true)
    }
  }, [])

  useEffect(() => {
    refreshMe()
    let active = true
    setPhase("loading")
    setSdkError(null)
    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then(async (cfg: PayPalConfig) => {
        if (!active) return
        setConfig(cfg)
        if (!cfg.enabled || !cfg.clientId) {
          setPhase("not-configured")
          return
        }
        await loadPayPalSdk(cfg.clientId, cfg.currency, cfg.mode)
        if (!active) return
        setPhase("ready")
      })
      .catch((err: unknown) => {
        if (!active) return
        setSdkError(err instanceof Error ? err.message : "Unknown error loading checkout")
        setPhase("sdk-error")
      })
    return () => {
      active = false
    }
  }, [refreshMe, attempt]) // attempt++ via the Retry button re-runs the bootstrap

  // Render PayPal buttons once the SDK AND the session state are known.
  // BOTH must be in the deps: on an SPA revisit the SDK resolves from cache
  // almost instantly while /api/auth/me is still in flight — if this effect
  // ran only on phase changes, the container would not exist yet and the
  // effect would silently skip, leaving a permanently empty checkout area
  // (the "PayPal window loaded once and then never again" bug).
  const canCheckout = meLoaded && !!me?.emailVerified

  useEffect(() => {
    if (phase !== "ready" || !config || !canCheckout) return
    const target = buttonsRef.current
    if (!target || typeof window.paypal?.Buttons !== "function") return

    let cancelled = false
    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-order", { method: "POST" })
        const data = (await res.json().catch(() => ({}))) as { orderId?: string; error?: string }
        if (!res.ok || !data.orderId) {
          // When createOrder fails the popup never opens and PayPal shows
          // NOTHING — surface the server's reason (rate limit, PayPal
          // outage, expired session) instead of a dead silent button.
          toast.error(data.error ?? "Could not start the checkout. Please try again.")
          throw new Error(data.error ?? "Could not start the checkout")
        }
        return data.orderId as string
      },
      onApprove: async (data) => {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          toast.error(json.error ?? "Payment verification failed")
          return
        }
        // Success — refresh entitlement + celebrate.
        setRefreshing(true)
        await refreshMe().finally(() => setRefreshing(false))
        toast.success("Premium is active on your account!")
        // GA4 purchase conversion (guard: gtag exists from layout).
        try {
          window.gtag?.("event", "purchase", {
            transaction_id: data.orderID,
            value: Number(config.price),
            currency: config.currency,
            items: [{ item_name: `Premium ${config.days}d` }],
          })
        } catch {
          /* analytics must never break checkout */
        }
      },
      onCancel: () => toast.info("Checkout cancelled — no charge was made"),
      onError: () => toast.error("PayPal reported an error. Please try again."),
    })

    buttons.render(target).catch((err: unknown) => {
      console.error("[premium] PayPal buttons render failed:", err)
      if (!cancelled) {
        setSdkError("The checkout buttons could not be rendered.")
        setPhase("sdk-error")
      }
    })

    return () => {
      cancelled = true
      buttons.close?.().catch(() => undefined)
    }
  }, [phase, config, canCheckout, refreshMe])

  /* ------------------------------- renderings ------------------------------ */

  const user = me
  const loggedIn = meLoaded && !!user
  const premium = user?.isPremium ?? false
  // Admins are premium by default, forever — even when the DB carries a
  // far-future expiry from the install bootstrap, never show a renewal date.
  const foreverPremium = premium && (!user?.premiumUntil || user?.role === "ADMIN")

  return (
    <section id="checkout" className="mx-auto mt-12 max-w-md scroll-mt-24" aria-label="Checkout">
      <div
        className={cn(
          "rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-8",
          premium ? "border-primary/40" : "border-border/60"
        )}
      >
        {/* Status line */}
        {!meLoaded || refreshing ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your plan…
          </div>
        ) : premium ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Crown className="h-4 w-4" /> Premium active
            </span>
            {user?.premiumUntil && !foreverPremium ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Active until{" "}
                  <strong className="text-foreground">{fmtDate(user.premiumUntil)}</strong>
                  <span
                    className={cn(
                      "ml-1",
                      daysLeft(user.premiumUntil) <= 7 ? "text-amber-500" : "text-muted-foreground/70"
                    )}
                  >
                    ({daysLeft(user.premiumUntil)}{" "}
                    {daysLeft(user.premiumUntil) === 1 ? "day" : "days"} left)
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground/70">
                  Paying again stacks — each payment adds {config?.days ?? 30} more days.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Premium is included with your account — no renewal needed.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold tracking-tight">
              ${config?.price ?? "3.00"}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                {config?.currency ?? "USD"} / {config?.days ?? 30} days
              </span>
            </p>
            {user && user.trackableLimit !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                Free plan: {user.trackableUsed}/{user.trackableLimit} trackable links used
              </p>
            )}
          </div>
        )}

        {/* Checkout actions */}
        <div className="mt-6">
          {!loggedIn ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Sign in to upgrade your account
              </p>
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/login?next=/premium">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/register?next=/premium">Create a free account</Link>
              </Button>
            </div>
          ) : !user?.emailVerified ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-center text-sm text-destructive">
                Verify your email address first to enable checkout.
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/dashboard/settings">Resend verification</Link>
              </Button>
            </div>
          ) : premium && foreverPremium ? (
            /* Forever-premium accounts (admins) never need to pay. */
            <p className="rounded-lg bg-primary/5 px-3.5 py-3 text-center text-sm text-muted-foreground">
              You&apos;re all set — premium is included with your account, no payment needed.
            </p>
          ) : phase === "not-configured" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium">Payments coming soon</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Online checkout isn&apos;t available on this server yet — please check back
                soon.
              </p>
            </div>
          ) : phase === "sdk-error" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium">Could not load PayPal checkout</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {sdkError ?? "Check your connection, then try again."}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => setAttempt((a) => a + 1)}
              >
                <Loader2 className="mr-2 h-4 w-4" /> Retry loading checkout
              </Button>
            </div>
          ) : (
            /* PayPal Smart Payment Buttons mount here — first purchase AND
             * renewals ("add more days") alike. */
            <div>
              {premium && (
                <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
                  Add {config?.days ?? 30} more days for{" "}
                  <strong className="text-foreground">
                    ${config?.price ?? "3.00"} {config?.currency ?? "USD"}
                  </strong>
                </p>
              )}
              <div ref={buttonsRef} aria-label="PayPal checkout buttons" />
              {(phase === "loading" || !config) && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading secure checkout…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Payments are processed by PayPal — card details never touch our servers.
          </p>
          <p className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Every payment is verified server-side before premium activates.
          </p>
        </div>
      </div>
    </section>
  )
}
