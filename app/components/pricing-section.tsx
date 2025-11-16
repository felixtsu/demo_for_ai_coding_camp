import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getRewriteUsageSummary } from '@/lib/rewrite/access'
import { SubscribeButton } from '@/app/components/subscribe-button'

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

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(priceCents / 100)

export default async function PricingSection() {
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

  const getButtonText = (planId: string) => {
    if (!user) {
      return '登入以訂閱'
    }
    if (currentPlanId === planId) {
      return '當前計劃'
    }
    if (currentPlanId) {
      // 比較價格來判斷是升級還是降級
      const currentPlan = planList.find(p => p.id === currentPlanId)
      const targetPlan = planList.find(p => p.id === planId)
      if (currentPlan && targetPlan) {
        return targetPlan.price_cents > currentPlan.price_cents ? '升級計劃' : '降級計劃'
      }
      return '升級計劃'
    }
    return '訂購'
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600 ring-1 ring-indigo-500/30 dark:bg-indigo-400/10 dark:text-indigo-200">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          Pricing
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            選擇最適合你的改寫方案
          </h2>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            所有方案皆提供安全的訂閱管理，配額每日重置
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {planList.map((plan) => {
          return (
            <div
              key={plan.id}
              className="flex flex-col gap-6 rounded-lg border border-white/70 bg-white/85 p-6 shadow-md shadow-indigo-500/5 backdrop-blur-xl transition hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-slate-900 dark:text-white">
                    {formatPrice(plan.price_cents).replace('TWD', '').trim()}
                  </span>
                  <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                    / 月
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  每日 {plan.daily_quota} 次改寫配額
                </p>
              </div>

              <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">✓</span>
                  <span>每日配額自動重置</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">✓</span>
                  <span>支援 Markdown 與長文內容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">✓</span>
                  <span>隨時可升級或降級方案</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">✓</span>
                  <span>安全的訂閱管理</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">✓</span>
                  <span>即時生成優化內容</span>
                </li>
              </ul>

              <div className="mt-auto space-y-3">
                <SubscribeButton
                  planId={plan.id}
                  billingPeriod="monthly"
                  isLoggedIn={Boolean(user)}
                  isCurrentPlan={currentPlanId === plan.id}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98] active:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                >
                  {getButtonText(plan.id)}
                </SubscribeButton>
                {!user && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    已是訂閱用戶？前往{' '}
                    <Link href="/rewrite" className="underline underline-offset-4 hover:text-indigo-600 dark:hover:text-indigo-400">
                      改寫工具
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

