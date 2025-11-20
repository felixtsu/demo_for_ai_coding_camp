import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  stripeSecretKey && stripeSecretKey !== 'sk_test_'
    ? new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' })
    : null

const TEAM_MIN_SEATS = 5
const TEAM_SEAT_PRICE_CENTS = 3999
const TEAM_CURRENCY = 'hkd'

type TeamPaymentIntentBody = {
  seat_count?: number
  billing_period?: 'monthly' | 'yearly'
  order_id?: string
}

export async function POST(request: Request) {
  if (!stripe) {
    console.error('STRIPE_SECRET_KEY 缺失或無效')
    return NextResponse.json({ error: '支付服務未配置' }, { status: 500 })
  }

  try {
    const body = (await request.json()) as TeamPaymentIntentBody
    const seatCount = Number(body.seat_count ?? 0)
    const billingPeriod = body.billing_period
    const orderId = body.order_id

    if (!Number.isInteger(seatCount) || seatCount < TEAM_MIN_SEATS) {
      return NextResponse.json({ error: `Team 方案至少需 ${TEAM_MIN_SEATS} 個座席` }, { status: 400 })
    }

    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: '無效的計費週期' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const unitAmountCents = billingPeriod === 'yearly' ? TEAM_SEAT_PRICE_CENTS * 10 : TEAM_SEAT_PRICE_CENTS
    const totalAmountCents = unitAmountCents * seatCount

    const { data: existingOrder } = orderId
      ? await supabase
          .from('stripe_orders')
          .select('id, user_id, status, stripe_payment_intent_id, client_reference_id')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .eq('plan_id', 'team')
          .maybeSingle()
      : { data: null }

    let paymentIntent: Stripe.PaymentIntent | null = null
    let nextOrderId = orderId
    let clientReferenceId = existingOrder?.client_reference_id

    if (existingOrder && existingOrder.stripe_payment_intent_id && existingOrder.status === 'pending') {
      try {
        const currentIntent = await stripe.paymentIntents.retrieve(existingOrder.stripe_payment_intent_id)
        if (currentIntent.status === 'requires_payment_method') {
          paymentIntent = await stripe.paymentIntents.update(existingOrder.stripe_payment_intent_id, {
            amount: totalAmountCents,
            currency: TEAM_CURRENCY,
            metadata: {
              order_id: existingOrder.id,
              user_id: user.id,
              plan_id: 'team',
              billing_period: billingPeriod,
              seat_count: seatCount.toString(),
              unit_amount_cents: unitAmountCents.toString(),
              client_reference_id: currentIntent.metadata?.client_reference_id ?? existingOrder.client_reference_id ?? '',
            },
          })
          nextOrderId = existingOrder.id
          clientReferenceId = currentIntent.metadata?.client_reference_id ?? existingOrder.client_reference_id
        }
      } catch (intentError) {
        console.warn('Existing PaymentIntent update failed, will create a new one', intentError)
      }
    }

    if (!paymentIntent) {
      clientReferenceId = crypto.randomUUID()
      const { data: newOrder, error: insertError } = await supabase
        .from('stripe_orders')
        .insert({
          user_id: user.id,
          plan_id: 'team',
          billing_period: billingPeriod,
          status: 'pending',
          client_reference_id: clientReferenceId,
          seat_count: seatCount,
          unit_amount_cents: unitAmountCents,
        })
        .select('id')
        .single()

      if (insertError || !newOrder) {
        console.error('Create team order failed:', insertError)
        return NextResponse.json({ error: '建立訂單失敗' }, { status: 500 })
      }

      nextOrderId = newOrder.id

      paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: TEAM_CURRENCY,
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email ?? undefined,
        metadata: {
          order_id: newOrder.id,
          user_id: user.id,
          plan_id: 'team',
          billing_period: billingPeriod,
          seat_count: seatCount.toString(),
          unit_amount_cents: unitAmountCents.toString(),
          client_reference_id: clientReferenceId,
        },
      })
    } else {
      await supabase
        .from('stripe_orders')
        .update({
          seat_count: seatCount,
          unit_amount_cents: unitAmountCents,
        })
        .eq('id', nextOrderId as string)
    }

    if (!paymentIntent.client_secret) {
      console.error('PaymentIntent missing client_secret', paymentIntent.id)
      return NextResponse.json({ error: '建立付款意圖失敗' }, { status: 500 })
    }

    if (nextOrderId) {
      await supabase
        .from('stripe_orders')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          seat_count: seatCount,
          unit_amount_cents: unitAmountCents,
        })
        .eq('id', nextOrderId)
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      order_id: nextOrderId,
      unit_amount_cents: unitAmountCents,
      total_amount_cents: totalAmountCents,
      client_reference_id: clientReferenceId,
    })
  } catch (error) {
    console.error('Team payment intent error:', error)
    return NextResponse.json({ error: '建立付款意圖失敗' }, { status: 500 })
  }
}


