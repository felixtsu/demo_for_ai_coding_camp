import { createClient } from '@/lib/supabase/server'
import { rewriteText } from '@/lib/deepseek'
import { consumeRewriteCredit, getRewriteUsageSummary } from '@/lib/rewrite/access'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: '請輸入有效的文字' }, { status: 400 })
    }

    const usageSummary = await getRewriteUsageSummary(supabase, user.id)

    if (!usageSummary.hasSubscription) {
      return NextResponse.json(
        { error: '需要有效訂閱才能使用此功能', code: 'subscription_required' },
        { status: 402 }
      )
    }

    if (!usageSummary.remaining || usageSummary.remaining <= 0) {
      return NextResponse.json(
        { error: '今日配額已用完，請明日再試或升級方案', code: 'quota_exhausted' },
        { status: 429 }
      )
    }

    const result = await rewriteText(text)

    try {
      const consumption = await consumeRewriteCredit(supabase)

      const quotaValue = consumption.quota ?? usageSummary.quota ?? 0
      const remainingValue =
        consumption.remaining ?? Math.max((usageSummary.remaining ?? 1) - 1, 0)
      const usedValue = Math.max(quotaValue - remainingValue, 0)

      const updatedUsage = {
        hasSubscription: true as const,
        planId: consumption.planId ?? usageSummary.planId,
        planName: consumption.planName ?? usageSummary.planName,
        quota: quotaValue,
        remaining: remainingValue,
        renewsAt: consumption.renewsAt ?? usageSummary.renewsAt,
        used: usedValue,
      }

      return NextResponse.json({ result, usage: updatedUsage })
    } catch (consumeError) {
      const message = consumeError instanceof Error ? consumeError.message : ''

      if (message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json(
          { error: '今日配額已用完，請明日再試或升級方案', code: 'quota_exhausted' },
          { status: 429 }
        )
      }

      if (message.includes('SUBSCRIPTION_MISSING')) {
        return NextResponse.json(
          { error: '需要有效訂閱才能使用此功能', code: 'subscription_required' },
          { status: 402 }
        )
      }

      console.error('Update usage failed:', consumeError)
      return NextResponse.json(
        {
          error: '改寫成功，但更新使用次數時發生問題',
          code: 'usage_update_failed',
          result,
        },
        { status: 207 }
      )
    }
  } catch (error) {
    console.error('Rewrite error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '改寫失敗' },
      { status: 500 }
    )
  }
}

