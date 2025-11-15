import type { SupabaseClient } from '@supabase/supabase-js'

type GenericSupabaseClient = SupabaseClient<any, any, any>

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const

export type RewriteUsageSummary = {
  hasSubscription: boolean
  planId?: string
  planName?: string
  quota?: number
  remaining?: number
  renewsAt?: string
  used?: number
}

const getTodayDate = () => {
  const now = new Date()
  // Normalize to UTC date string (YYYY-MM-DD)
  return now.toISOString().split('T')[0]
}

const isNoRowError = (error: { code?: string } | null) => error?.code === 'PGRST116'

export async function getRewriteUsageSummary(
  supabase: GenericSupabaseClient,
  userId: string
): Promise<RewriteUsageSummary> {
  const nowIso = new Date().toISOString()

  const {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from('user_subscriptions')
    .select(
      `
      id,
      status,
      current_period_end,
      plan:subscription_plans (
        id,
        name,
        daily_quota
      )
    `
    )
    .eq('user_id', userId)
    .in('status', ACTIVE_SUBSCRIPTION_STATUSES as unknown as string[])
    .gt('current_period_end', nowIso)
    .order('current_period_end', { ascending: false })
    .maybeSingle()

  if (subscriptionError && !isNoRowError(subscriptionError)) {
    console.error('Subscription query error:', subscriptionError)
    throw new Error(`無法取得訂閱資訊：${subscriptionError.message}`)
  }

  if (!subscription) {
    // 檢查是否有訂閱（包括過期的），用於調試
    const { data: anySub } = await supabase
      .from('user_subscriptions')
      .select('id, status, current_period_end, plan_id')
      .eq('user_id', userId)
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES as unknown as string[])
      .order('current_period_end', { ascending: false })
      .maybeSingle()
    
    if (anySub) {
      const isExpired = new Date(anySub.current_period_end) <= new Date(nowIso)
      console.warn('User has subscription but it may be expired or plan missing:', {
        subscription_id: anySub.id,
        plan_id: anySub.plan_id,
        current_period_end: anySub.current_period_end,
        now: nowIso,
        is_expired: isExpired,
      })
    }
    return { hasSubscription: false }
  }

  if (!subscription.plan) {
    // 如果訂閱存在但方案不存在，嘗試直接查詢方案
    const { data: directPlan } = await supabase
      .from('subscription_plans')
      .select('id, name, daily_quota')
      .eq('id', (subscription as any).plan_id)
      .maybeSingle()
    
    if (directPlan) {
      console.warn('Plan exists but join failed, using direct query:', directPlan)
      // 如果方案存在，使用直接查詢的結果
      const quota = directPlan.daily_quota ?? 0
      if (quota > 0) {
        const today = getTodayDate()
        const {
          data: usage,
          error: usageError,
        } = await supabase
          .from('rewrite_usage')
          .select('usage_count')
          .eq('user_id', userId)
          .eq('usage_date', today)
          .maybeSingle()

        if (usageError && !isNoRowError(usageError)) {
          throw new Error(`無法取得今日使用次數：${usageError.message}`)
        }

        const used = usage?.usage_count ?? 0
        const remaining = Math.max(quota - used, 0)

        return {
          hasSubscription: true,
          planId: directPlan.id ?? undefined,
          planName: directPlan.name ?? undefined,
          quota,
          remaining,
          renewsAt: subscription.current_period_end ?? undefined,
          used,
        }
      }
    }
    
    console.error('Subscription found but plan is missing:', {
      subscription_id: subscription.id,
      plan_id: (subscription as any).plan_id,
    })
    return { hasSubscription: false }
  }

  const quota = subscription.plan.daily_quota ?? 0

  if (quota <= 0) {
    return { hasSubscription: false }
  }

  const today = getTodayDate()
  const {
    data: usage,
    error: usageError,
  } = await supabase
    .from('rewrite_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle()

  if (usageError && !isNoRowError(usageError)) {
    throw new Error(`無法取得今日使用次數：${usageError.message}`)
  }

  const used = usage?.usage_count ?? 0
  const remaining = Math.max(quota - used, 0)

  return {
    hasSubscription: true,
    planId: subscription.plan.id ?? undefined,
    planName: subscription.plan.name ?? undefined,
    quota,
    remaining,
    renewsAt: subscription.current_period_end ?? undefined,
    used,
  }
}

type ConsumeCreditResult = {
  remaining: number
  quota: number
  planId?: string
  planName?: string
  renewsAt?: string
}

const isQuotaExceededError = (message: string | undefined) =>
  Boolean(message && message.toUpperCase().includes('QUOTA_EXCEEDED'))

const isSubscriptionMissingError = (message: string | undefined) =>
  Boolean(message && message.toUpperCase().includes('SUBSCRIPTION_MISSING'))

export async function consumeRewriteCredit(
  supabase: GenericSupabaseClient
): Promise<ConsumeCreditResult> {
  const { data, error } = await supabase.rpc('consume_rewrite_credit')

  if (error) {
    if (isQuotaExceededError(error.message)) {
      throw new Error('QUOTA_EXCEEDED')
    }

    if (isSubscriptionMissingError(error.message)) {
      throw new Error('SUBSCRIPTION_MISSING')
    }

    throw new Error(`CONSUME_FAILED:${error.message}`)
  }

  const payload = Array.isArray(data) ? data[0] : data

  if (!payload) {
    throw new Error('CONSUME_FAILED:EMPTY_RESPONSE')
  }

  return {
    remaining: payload.remaining ?? 0,
    quota: payload.quota ?? 0,
    planId: payload.plan_id ?? undefined,
    planName: payload.plan_name ?? undefined,
    renewsAt: payload.renews_at ?? undefined,
  }
}



