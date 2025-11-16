'use client'

import { useState } from 'react'

type SubscribeButtonProps = {
  planId: string
  billingPeriod: 'monthly' | 'yearly'
  isLoggedIn: boolean
  isCurrentPlan: boolean
  className?: string
  children?: React.ReactNode
}

export function SubscribeButton({
  planId,
  billingPeriod,
  isLoggedIn,
  isCurrentPlan,
  className,
  children,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClick = async () => {
    setErrorMessage(null)
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/pricing`
      return
    }
    if (isCurrentPlan) {
      window.location.href = `/rewrite`
      return
    }
    try {
      setLoading(true)
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, billing_period: billingPeriod }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || '建立訂單失敗')
      }
      const data = await response.json()
      const url: string | undefined = data?.url
      if (!url) {
        throw new Error('未取得支付鏈接')
      }
      // Open Stripe Payment Link in a new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      const message = e instanceof Error ? e.message : '建立訂單失敗'
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? '前往付款中...' : children}
      </button>
    </>
  )
}


