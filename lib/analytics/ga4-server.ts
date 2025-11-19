type ServerEventValue = string | number | boolean | null | undefined

type ServerEventPayload = {
  eventName: string
  params?: Record<string, ServerEventValue>
  clientId?: string
  userId?: string
}

const measurementId =
  process.env.GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  'G-WGE0B4BNDR'
const apiSecret = process.env.GA4_API_SECRET

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

const sanitizeParams = (params?: Record<string, ServerEventValue>) => {
  if (!params) return undefined
  return Object.entries(params).reduce<Record<string, ServerEventValue>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc
    }
    acc[key] = value
    return acc
  }, {})
}

export async function sendServerGAEvent(payload: ServerEventPayload) {
  if (!apiSecret || !measurementId) {
    console.warn('[GA4] Missing measurement_id or api_secret, skip sending event')
    return
  }

  const clientId = payload.clientId || payload.userId || `server_${Date.now()}`
  const body: Record<string, unknown> = {
    client_id: clientId,
    events: [
      {
        name: payload.eventName,
        params: sanitizeParams(payload.params) ?? {},
      },
    ],
  }

  if (payload.userId) {
    body.user_id = payload.userId
  }

  try {
    const url = `${GA_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[GA4] Failed to send event', response.status, errorText)
    }
  } catch (error) {
    console.error('[GA4] Unexpected error while sending event', error)
  }
}

