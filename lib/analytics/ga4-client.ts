'use client'

type GAEventValue = string | number | boolean | undefined

export type GAEventPayload = Record<string, GAEventValue>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const isDev = process.env.NODE_ENV !== 'production'

export function trackGAEvent(eventName: string, params?: GAEventPayload) {
  if (typeof window === 'undefined') return

  if (typeof window.gtag !== 'function') {
    if (isDev) {
      console.warn(`[GA4] gtag not initialized for event: ${eventName}`)
    }
    return
  }

  window.gtag('event', eventName, params ?? {})
}

