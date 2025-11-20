import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CreateOrderBody = {
  plan_id?: string
  billing_period?: 'monthly' | 'yearly'
  seat_count?: number
}

const PAYMENT_LINKS: Record<string, { monthly?: string; yearly?: string }> = {
  starter: {
    monthly: 'https://buy.stripe.com/test_14A9AS9mo2CvaPM0Ufds401',
    yearly: 'https://buy.stripe.com/test_7sY6oGfKM6SL3nkeL5ds402',
  },
  professional: {
    monthly: 'https://buy.stripe.com/test_5kQ00iaqs7WP0b86ezds404',
    yearly: 'https://buy.stripe.com/test_dRm28q1TW6SL9LI8mHds403',
  },
}

const appendQueryParam = (url: string, key: string, value: string) => {
  const hasQuery = url.includes('?')
  return `${url}${hasQuery ? '&' : '?'}${key}=${encodeURIComponent(value)}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const body = (await request.json()) as CreateOrderBody
    const planId = body.plan_id
    const billingPeriod = body.billing_period

    if (!planId || (planId !== 'starter' && planId !== 'professional' && planId !== 'team')) {
      return NextResponse.json({ error: '無效的方案' }, { status: 400 })
    }
    if (!billingPeriod || (billingPeriod !== 'monthly' && billingPeriod !== 'yearly')) {
      return NextResponse.json({ error: '無效的計費週期' }, { status: 400 })
    }

    if (planId === 'team') {
      return NextResponse.json({ error: 'Team 方案請使用專屬付款頁面' }, { status: 400 })
    }

    const link = PAYMENT_LINKS[planId]?.[billingPeriod]
    if (!link) {
      return NextResponse.json({ error: '未配置對應的支付鏈接' }, { status: 400 })
    }

    // Create a unique client_reference_id that we can join back from Stripe webhook
    const clientReferenceId = crypto.randomUUID()

    // Persist order
    const { error: insertError } = await supabase.from('stripe_orders').insert({
      user_id: user.id,
      plan_id: planId,
      billing_period: billingPeriod,
      status: 'pending',
      stripe_payment_link_url: link,
      client_reference_id: clientReferenceId,
    } as any)

    if (insertError) {
      console.error('Create order failed:', insertError)
      return NextResponse.json({ error: '建立訂單失敗' }, { status: 500 })
    }

    const redirectUrl = appendQueryParam(link, 'client_reference_id', clientReferenceId)

    return NextResponse.json({ url: redirectUrl })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ error: '建立訂單失敗' }, { status: 500 })
  }
}


