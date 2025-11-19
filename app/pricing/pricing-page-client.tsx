'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PricingToggle } from '@/app/components/pricing-toggle'
import { HeroSection } from '@/app/components/hero-section'
import { FAQAccordion } from '@/app/components/faq-accordion'
import { Footer } from '@/app/components/footer'
import { trackGAEvent } from '@/lib/analytics/ga4-client'

type Plan = {
  id: string
  name: string
  description: string
  daily_quota: number
  price_cents: number
}

type PricingPageClientProps = {
  plans: Plan[]
  currentPlanId?: string
  isLoggedIn?: boolean
}

export function PricingPageClient({ plans, currentPlanId, isLoggedIn = false }: PricingPageClientProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (hasTrackedView.current) return
    trackGAEvent('view_pricing', {
      plan_count: plans.length,
      has_active_plan: currentPlanId ? 'yes' : 'no',
      is_logged_in: isLoggedIn ? 'yes' : 'no',
    })
    hasTrackedView.current = true
  }, [plans.length, currentPlanId, isLoggedIn])

  const getPrice = (priceCents: number) => {
    return period === 'yearly' ? Math.round(priceCents * 10) : priceCents
  }

  const getButtonText = (planId: string) => {
    if (!isLoggedIn) {
      return '登入以訂閱'
    }
    if (currentPlanId === planId) {
      return '當前計劃'
    }
    if (currentPlanId) {
      // 比較價格來判斷是升級還是降級
      const currentPlan = plans.find(p => p.id === currentPlanId)
      const targetPlan = plans.find(p => p.id === planId)
      if (currentPlan && targetPlan) {
        return targetPlan.price_cents > currentPlan.price_cents ? '升級計劃' : '降級計劃'
      }
      return '升級計劃'
    }
    return '訂購'
  }

  const handleSubscribe = async (planId: string) => {
    setErrorMessage(null)
    trackGAEvent('select_plan', {
      plan_id: planId,
      billing_period: period,
      is_logged_in: isLoggedIn ? 'yes' : 'no',
    })

    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/pricing`
      return
    }
    if (currentPlanId === planId) {
      window.location.href = `/rewrite`
      return
    }
    try {
      setLoadingPlanId(planId)
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, billing_period: period }),
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
      let clientReferenceId: string | undefined
      try {
        const parsed = new URL(url)
        clientReferenceId = parsed.searchParams.get('client_reference_id') ?? undefined
      } catch {
        clientReferenceId = undefined
      }
      trackGAEvent('begin_checkout', {
        plan_id: planId,
        billing_period: period,
        client_reference_id: clientReferenceId,
      })
      // Open Stripe Payment Link in a new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      const message = e instanceof Error ? e.message : '建立訂單失敗'
      setErrorMessage(message)
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <>
      <HeroSection title="Pricing" subtitle="Choose the plan that works for you" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-12 bg-white px-16 py-16">
        <PricingToggle onToggle={setPeriod} defaultPeriod="monthly" />

        {errorMessage && (
          <div className="w-full max-w-[1200px] rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid w-full grid-cols-3 gap-16 items-stretch">
          {plans.map((plan) => {
            const price = getPrice(plan.price_cents)
            return (
              <div
                key={plan.id}
                className="flex h-full flex-col items-center gap-6 rounded-lg border border-[#D9D9D9] bg-white p-8"
              >
                <div className="flex w-full flex-1 flex-col items-center gap-4">
                  <h3 className="text-center text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
                    {plan.name}
                  </h3>
                  <p className="text-center text-sm font-normal leading-[1.4em] text-[#757575] min-h-[2.8em]">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold leading-[1em] tracking-[-0.02em] text-[#1E1E1E]">
                      ${Math.floor(price / 100)}
                    </span>
                    <span className="text-sm font-normal leading-[1.8em] text-[#1E1E1E]">
                      / mo
                    </span>
                  </div>
                  <p className="text-sm text-[#757575]">
                    每日 {plan.daily_quota} 次改寫配額
                  </p>
                  <ul className="flex w-full flex-col gap-3 text-base font-normal leading-[1.4em] text-[#757575]">
                    <li>每日配額自動重置</li>
                    <li>支援 Markdown 與長文內容</li>
                    <li>隨時可升級或降級方案</li>
                    <li>安全的訂閱管理</li>
                    <li>即時生成優化內容</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlanId === plan.id}
                  className="w-full rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-3 py-3 text-center text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.02] active:scale-[0.98] active:bg-[#0F0F0F] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingPlanId === plan.id ? '前往付款中...' : getButtonText(plan.id)}
                </button>
              </div>
            )
          })}
        </div>
      </div>
      <FAQAccordion />
      <Footer />
    </>
  )
}

