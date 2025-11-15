import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PricingPageClient } from './pricing-page-client'
import { getRewriteUsageSummary } from '@/lib/rewrite/access'

type Plan = {
  id: string
  name: string
  description: string
  daily_quota: number
  price_cents: number
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: '適合偶爾使用的個人創作者，每日 5 次改寫配額。',
    daily_quota: 5,
    price_cents: 9900,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '專業寫作者方案，每日 20 次改寫。',
    daily_quota: 20,
    price_cents: 24900,
  },
  {
    id: 'team',
    name: 'Team',
    description: '團隊合用方案，每日 60 次配額。',
    daily_quota: 60,
    price_cents: 59900,
  },
]

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name, description, daily_quota, price_cents')
    .order('price_cents', { ascending: true })

  if (error) {
    console.error('Load plans failed:', error)
  }

  // 過濾掉測試方案，只顯示正式方案
  const filteredPlans = plans && plans.length > 0 
    ? plans.filter(plan => plan.id !== 'pro-test')
    : FALLBACK_PLANS

  const planList = filteredPlans.map((plan) => ({
    ...plan,
    price_cents: plan.price_cents ?? 0,
    daily_quota: plan.daily_quota ?? 0,
  }))

  // 獲取用戶訂閱資訊
  let currentPlanId: string | undefined
  if (user) {
    try {
      const usageSummary = await getRewriteUsageSummary(supabase, user.id)
      currentPlanId = usageSummary.planId
    } catch (error) {
      console.error('Failed to get subscription info:', error)
    }
  }

  return <PricingPageClient plans={planList} currentPlanId={currentPlanId} isLoggedIn={!!user} />
}


