import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_', {
  apiVersion: '2024-04-10',
})

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: '配置錯誤' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const payload = await request.text()
    event = stripe.webhooks.constructEvent(
      Buffer.from(payload, 'utf8'),
      signature,
      webhookSecret
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : '簽名驗證失敗'
    console.error('Stripe webhook signature verification failed:', msg)
    return NextResponse.json({ error: '簽名驗證失敗' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const clientRef = session.client_reference_id

      if (!clientRef) {
        console.warn('checkout.session.completed missing client_reference_id')
        return NextResponse.json({ received: true })
      }

      // Fetch the order by client_reference_id
      const { data: order, error: orderError } = await supabase
        .from('stripe_orders')
        .select('id, user_id, plan_id, billing_period, status')
        .eq('client_reference_id', clientRef)
        .maybeSingle()

      if (orderError || !order) {
        console.error('Order not found for client_reference_id:', clientRef, orderError)
        return NextResponse.json({ received: true })
      }

      // Mark order as completed
      const { error: updateOrderError } = await supabase
        .from('stripe_orders')
        .update({
          status: 'completed',
          stripe_checkout_session_id: session.id ?? null,
        } as any)
        .eq('id', order.id)

      if (updateOrderError) {
        console.error('Update order failed:', updateOrderError)
      }

      // Activate or upsert subscription
      const now = new Date()
      const start = now.toISOString()
      const end = new Date(now)
      if (order.billing_period === 'yearly') {
        end.setFullYear(end.getFullYear() + 1)
      } else {
        end.setMonth(end.getMonth() + 1)
      }
      const endIso = end.toISOString()

      // Ensure single active subscription per user:
      // select by user_id, then update-or-insert (no ON CONFLICT since there's no unique constraint on user_id)
      const { data: existingSub, error: findSubError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', order.user_id)
        .maybeSingle()

      if (findSubError) {
        console.error('Find subscription failed:', findSubError)
      } else if (existingSub?.id) {
        const { error: updateSubError } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: order.plan_id,
            status: 'active',
            current_period_start: start,
            current_period_end: endIso,
            cancel_at_period_end: false,
          } as any)
          .eq('id', existingSub.id)

        if (updateSubError) {
          console.error('Update subscription failed:', updateSubError)
        }
      } else {
        const { error: insertSubError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: order.user_id,
            plan_id: order.plan_id,
            status: 'active',
            current_period_start: start,
            current_period_end: endIso,
            cancel_at_period_end: false,
          } as any)

        if (insertSubError) {
          console.error('Insert subscription failed:', insertSubError)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Webhook handling error:', e)
    return NextResponse.json({ error: '處理失敗' }, { status: 500 })
  }
}


