'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { trackGAEvent } from '@/lib/analytics/ga4-client'

type BillingPeriod = 'monthly' | 'yearly'

type TeamCheckoutPageClientProps = {
  initialSeats: number
  initialPeriod: BillingPeriod
  publishableKey: string
}

const TEAM_MIN_SEATS = 5
const TEAM_SEAT_PRICE_CENTS = 3999

export function TeamCheckoutPageClient({
  initialSeats,
  initialPeriod,
  publishableKey,
}: TeamCheckoutPageClientProps) {
  const [seatCount, setSeatCount] = useState(Math.max(TEAM_MIN_SEATS, initialSeats))
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod)
  const [orderId, setOrderId] = useState<string | undefined>(undefined)
  const orderIdRef = useRef<string | undefined>(undefined)
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined)
  const [clientReferenceId, setClientReferenceId] = useState<string | undefined>(undefined)
  const [unitAmountCents, setUnitAmountCents] = useState<number>(getUnitAmount(initialPeriod))
  const [totalAmountCents, setTotalAmountCents] = useState<number>(getUnitAmount(initialPeriod) * Math.max(TEAM_MIN_SEATS, initialSeats))
  const [intentLoading, setIntentLoading] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [checkoutSucceeded, setCheckoutSucceeded] = useState(false)

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [publishableKey])

  useEffect(() => {
    orderIdRef.current = orderId
  }, [orderId])

  useEffect(() => {
    setUnitAmountCents(getUnitAmount(billingPeriod))
  }, [billingPeriod])

  useEffect(() => {
    setTotalAmountCents(unitAmountCents * seatCount)
  }, [unitAmountCents, seatCount])

  useEffect(() => {
    if (!publishableKey) return
    let isActive = true
    const controller = new AbortController()

    const fetchIntent = async () => {
      setIntentLoading(true)
      setIntentError(null)
      try {
        const response = await fetch('/api/team/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            seat_count: seatCount,
            billing_period: billingPeriod,
            ...(orderIdRef.current ? { order_id: orderIdRef.current } : {}),
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || '建立付款意圖失敗')
        }

        const data = (await response.json()) as {
          client_secret: string
          order_id: string
          total_amount_cents: number
          unit_amount_cents: number
          client_reference_id?: string
        }

        if (!isActive) return
        setClientSecret(data.client_secret)
        setOrderId(data.order_id)
        setClientReferenceId(data.client_reference_id)
        setUnitAmountCents(data.unit_amount_cents)
        setTotalAmountCents(data.total_amount_cents)
        orderIdRef.current = data.order_id
        trackGAEvent('team_payment_intent_ready', {
          order_id: data.order_id,
          seat_count: seatCount,
          billing_period: billingPeriod,
          total_amount_cents: data.total_amount_cents,
        })
      } catch (error) {
        if (!isActive) return
        const message = error instanceof Error ? error.message : '建立付款意圖失敗'
        setIntentError(message)
        setClientSecret(undefined)
      } finally {
        if (isActive) {
          setIntentLoading(false)
        }
      }
    }

    const debounce = setTimeout(fetchIntent, 200)

    return () => {
      isActive = false
      controller.abort()
      clearTimeout(debounce)
    }
  }, [seatCount, billingPeriod, publishableKey])

  if (!publishableKey) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Stripe 尚未配置</h1>
        <p className="text-gray-600">
          請設定 <code className="rounded bg-gray-100 px-2 py-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> 後重新部署。
        </p>
        <Link href="/pricing" className="text-blue-600 underline">
          返回方案頁
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Team 方案結帳</h1>
          <p className="text-sm text-gray-500">選擇座席數量並完成一次性付款</p>
        </div>
        <Link href="/pricing" className="text-sm text-blue-600 underline">
          返回方案
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">座席設定</h2>
          <p className="text-sm text-gray-500">Team 方案至少 {TEAM_MIN_SEATS} 席</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 text-2xl text-gray-700 disabled:opacity-50"
              onClick={() => setSeatCount((prev) => Math.max(TEAM_MIN_SEATS, prev - 1))}
              disabled={seatCount <= TEAM_MIN_SEATS || intentLoading}
              aria-label="減少座席"
            >
              –
            </button>
            <input
              type="number"
              min={TEAM_MIN_SEATS}
              value={seatCount}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (Number.isNaN(next)) return
                setSeatCount(Math.max(TEAM_MIN_SEATS, Math.floor(next)))
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-2xl font-semibold text-gray-900"
            />
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 text-2xl text-gray-700"
              onClick={() => setSeatCount((prev) => prev + 1)}
              disabled={intentLoading}
              aria-label="增加座席"
            >
              +
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-gray-700">計費週期</p>
            <div className="grid grid-cols-2 gap-3">
              {(['monthly', 'yearly'] as BillingPeriod[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBillingPeriod(option)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    billingPeriod === option
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  disabled={intentLoading}
                >
                  {option === 'monthly' ? '每月付款' : '年繳（送兩個月）'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-xl bg-gray-50 p-5">
            <h3 className="text-base font-semibold text-gray-800">訂單摘要</h3>
            <dl className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>每席單價</dt>
                <dd>HK${(unitAmountCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>座席數</dt>
                <dd>{seatCount} 位</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-500">一次性總額</p>
              <p className="text-2xl font-semibold text-gray-900">HK${(totalAmountCents / 100).toFixed(2)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">成功付款後立即啟用 Team 方案，無自動續費。</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">付款資訊</h2>
          <p className="text-sm text-gray-500">使用 Stripe Payment Elements 完成付款。</p>

          {intentError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {intentError}
            </div>
          )}

          {checkoutSucceeded ? (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
              <h3 className="text-xl font-semibold text-green-700">付款成功！</h3>
              <p className="mt-2 text-sm text-green-800">
                我們已收到您的款項，權限將在幾秒內生效。您可以前往改寫頁開始使用。
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/rewrite"
                  className="rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  立即開始使用
                </Link>
                <Link href="/pricing" className="text-sm text-green-800 underline">
                  返回方案頁
                </Link>
              </div>
            </div>
          ) : (
            <>
              {intentLoading && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Stripe 付款資訊載入中...
                </div>
              )}
              {clientSecret && stripePromise && (
                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                  <TeamPaymentForm
                    totalAmountCents={totalAmountCents}
                    onSuccess={() => {
                      setCheckoutSucceeded(true)
                      trackGAEvent('team_payment_success', {
                        order_id: orderId,
                        client_reference_id: clientReferenceId,
                        total_amount_cents: totalAmountCents,
                      })
                    }}
                  />
                </Elements>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getUnitAmount(period: BillingPeriod) {
  return period === 'yearly' ? TEAM_SEAT_PRICE_CENTS * 10 : TEAM_SEAT_PRICE_CENTS
}

function TeamPaymentForm({ onSuccess, totalAmountCents }: { onSuccess: () => void; totalAmountCents: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setSubmitError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setSubmitError(error.message ?? '付款失敗，請再試一次')
    } else {
      onSuccess()
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <PaymentElement />
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-xl bg-black px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? '付款處理中…' : `支付 HK$${(totalAmountCents / 100).toFixed(2)}`}
      </button>
      <p className="text-center text-xs text-gray-500">
        付款資訊由 Stripe 安全處理。我們不會儲存您的信用卡資料。
      </p>
    </form>
  )
}


