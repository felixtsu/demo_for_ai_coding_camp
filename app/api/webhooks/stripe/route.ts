import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendServerGAEvent } from '@/lib/analytics/ga4-server'

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
    event = stripe.webhooks.constructEvent(Buffer.from(payload, 'utf8'), signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : '簽名驗證失敗'
    console.error('Stripe webhook signature verification failed:', msg)
    return NextResponse.json({ error: '簽名驗證失敗' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break
      }
      case 'payment_intent.succeeded': {
        await handleTeamPaymentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
        break
      }
      case 'invoice.paid': {
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase)
        break
      }
      case 'invoice.payment_failed': {
        await handleInvoiceFailed(event.data.object as Stripe.Invoice, supabase)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription, supabase)
        break
      }
      default: {
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Webhook handling error:', e)
    return NextResponse.json({ error: '處理失敗' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: ReturnType<typeof createAdminClient>) {
  const clientRef = session.client_reference_id

  if (!clientRef) {
    console.warn('checkout.session.completed missing client_reference_id')
    return
  }

  const order = await findOrderByClientReference(supabase, clientRef)
  if (!order) {
    return
  }

  const seatCountMetadata = session.metadata?.seat_count
  const unitAmountMetadata = session.metadata?.unit_amount_cents
  const parsedSeatCount = seatCountMetadata ? Number(seatCountMetadata) : undefined
  const parsedUnitAmount = unitAmountMetadata ? Number(unitAmountMetadata) : undefined
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? undefined
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? undefined

  const subscriptionDetails = stripeSubscriptionId ? await retrieveStripeSubscription(stripeSubscriptionId) : null

  await updateOrderStatus(supabase, order.id, {
    status: 'completed',
    stripe_checkout_session_id: session.id ?? null,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    seat_count: parsedSeatCount,
    unit_amount_cents: parsedUnitAmount,
  })

  await syncUserSubscription(supabase, {
    userId: order.user_id,
    planId: order.plan_id,
    billingPeriod: order.billing_period,
    subscriptionId: stripeSubscriptionId,
    customerId: stripeCustomerId,
    status: subscriptionDetails ? mapStripeSubscriptionStatus(subscriptionDetails.status) : 'active',
    currentPeriodStart: subscriptionDetails?.current_period_start,
    currentPeriodEnd: subscriptionDetails?.current_period_end,
    cancelAtPeriodEnd: subscriptionDetails?.cancel_at_period_end ?? false,
  })

  await sendServerGAEvent({
    eventName: 'purchase',
    clientId: clientRef,
    userId: order.user_id,
    params: {
      plan_id: order.plan_id,
      billing_period: order.billing_period,
      currency: session.currency ?? 'usd',
      value: session.amount_total ? session.amount_total / 100 : undefined,
      stripe_checkout_session_id: session.id ?? undefined,
      stripe_subscription_id: stripeSubscriptionId ?? undefined,
    },
  })
}

async function handleTeamPaymentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: ReturnType<typeof createAdminClient>) {
  const orderId = paymentIntent.metadata?.order_id

  if (!orderId) {
    console.warn('payment_intent.succeeded missing order_id metadata')
    return
  }

  const order = await findOrderById(supabase, orderId)
  if (!order) {
    console.warn('payment_intent.succeeded could not find order', orderId)
    return
  }

  const seatCountMetadata = paymentIntent.metadata?.seat_count
  const unitAmountMetadata = paymentIntent.metadata?.unit_amount_cents
  const parsedSeatCount = seatCountMetadata ? Number(seatCountMetadata) : undefined
  const parsedUnitAmount = unitAmountMetadata ? Number(unitAmountMetadata) : undefined

  await updateOrderStatus(supabase, order.id, {
    status: 'completed',
    stripe_payment_intent_id: paymentIntent.id,
    seat_count: parsedSeatCount,
    unit_amount_cents: parsedUnitAmount,
  })

  await syncUserSubscription(supabase, {
    userId: order.user_id,
    planId: order.plan_id,
    billingPeriod: order.billing_period,
    status: 'active',
  })

  await sendServerGAEvent({
    eventName: 'purchase',
    clientId: paymentIntent.metadata?.client_reference_id ?? order.client_reference_id ?? undefined,
    userId: order.user_id,
    params: {
      plan_id: order.plan_id,
      billing_period: order.billing_period,
      currency: paymentIntent.currency ?? 'usd',
      value: paymentIntent.amount_received ? paymentIntent.amount_received / 100 : undefined,
      stripe_payment_intent_id: paymentIntent.id,
    },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: ReturnType<typeof createAdminClient>) {
  const subscriptionId = getString(invoice.subscription)
  if (!subscriptionId) {
    console.warn('invoice.paid missing subscription id')
    return
  }

  const order = await findOrderByStripeSubscriptionId(supabase, subscriptionId)
  if (!order) {
    console.warn('invoice.paid unable to find order for subscription', subscriptionId)
    return
  }

  const period = invoice.lines.data[0]?.period
  const billingPeriod = deriveBillingPeriodFromInvoice(invoice)
  const customerId = getString(invoice.customer)

  await syncUserSubscription(supabase, {
    userId: order.user_id,
    planId: order.plan_id,
    billingPeriod,
    subscriptionId,
    customerId,
    status: 'active',
    currentPeriodStart: period?.start,
    currentPeriodEnd: period?.end,
    cancelAtPeriodEnd: false,
  })

  await sendServerGAEvent({
    eventName: 'subscription_renewal',
    clientId: order.client_reference_id ?? subscriptionId,
    userId: order.user_id,
    params: {
      plan_id: order.plan_id,
      billing_period: billingPeriod,
      currency: invoice.currency ?? 'usd',
      value: invoice.amount_paid ? invoice.amount_paid / 100 : undefined,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
    },
  })
}

async function handleInvoiceFailed(invoice: Stripe.Invoice, supabase: ReturnType<typeof createAdminClient>) {
  const subscriptionId = getString(invoice.subscription)
  if (!subscriptionId) {
    console.warn('invoice.payment_failed missing subscription id')
    return
  }

  const order = await findOrderByStripeSubscriptionId(supabase, subscriptionId)
  if (!order) {
    console.warn('invoice.payment_failed unable to find order for subscription', subscriptionId)
    return
  }

  await syncUserSubscription(supabase, {
    userId: order.user_id,
    planId: order.plan_id,
    billingPeriod: order.billing_period,
    subscriptionId,
    customerId: getString(invoice.customer),
    status: 'past_due',
    cancelAtPeriodEnd: false,
  })

  await sendServerGAEvent({
    eventName: 'subscription_payment_failed',
    clientId: order.client_reference_id ?? subscriptionId,
    userId: order.user_id,
    params: {
      plan_id: order.plan_id,
      billing_period: order.billing_period,
      currency: invoice.currency ?? 'usd',
      value: invoice.amount_due ? invoice.amount_due / 100 : undefined,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
    },
  })
}

async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>
) {
  const subscriptionId = subscription.id
  const existingSub = await findUserSubscriptionByStripeId(supabase, subscriptionId)
  const order = await findOrderByStripeSubscriptionId(supabase, subscriptionId)

  if (!existingSub && !order) {
    console.warn('customer.subscription.deleted unable to locate subscription data', subscriptionId)
    return
  }

  const targetUserId = existingSub?.user_id ?? order?.user_id
  const targetPlanId = existingSub?.plan_id ?? order?.plan_id
  const targetBillingPeriod = existingSub?.billing_period ?? order?.billing_period ?? 'monthly'

  if (!targetUserId || !targetPlanId) {
    console.warn('customer.subscription.deleted missing local subscription mapping', subscriptionId)
    return
  }

  await syncUserSubscription(supabase, {
    userId: targetUserId,
    planId: targetPlanId,
    billingPeriod: targetBillingPeriod,
    subscriptionId,
    customerId: subscription.customer ? getString(subscription.customer) : undefined,
    status: 'canceled',
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? true,
  })

  if (order) {
    await sendServerGAEvent({
      eventName: 'subscription_canceled',
      clientId: order.client_reference_id ?? subscriptionId,
      userId: order.user_id,
      params: {
        plan_id: order.plan_id,
        billing_period: order.billing_period,
        stripe_subscription_id: subscriptionId,
      },
    })
  }
}
async function findUserSubscriptionByStripeId(supabase: ReturnType<typeof createAdminClient>, subscriptionId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id, user_id, plan_id, billing_period')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    console.error('Find user subscription by stripe id failed:', error)
  }

  return data ?? null
}

async function findOrderByClientReference(
  supabase: ReturnType<typeof createAdminClient>,
  clientReferenceId: string
) {
  const { data: order, error } = await supabase
    .from('stripe_orders')
    .select(
      'id, user_id, plan_id, billing_period, status, seat_count, unit_amount_cents, client_reference_id, stripe_subscription_id'
    )
    .eq('client_reference_id', clientReferenceId)
    .maybeSingle()

  if (error || !order) {
    console.error('Order not found for client_reference_id:', clientReferenceId, error)
    return null
  }
  return order
}

async function findOrderById(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: order, error } = await supabase
    .from('stripe_orders')
    .select(
      'id, user_id, plan_id, billing_period, status, seat_count, unit_amount_cents, client_reference_id, stripe_subscription_id'
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) {
    console.error('Order not found for id:', orderId, error)
    return null
  }
  return order
}

async function findOrderByStripeSubscriptionId(
  supabase: ReturnType<typeof createAdminClient>,
  subscriptionId: string
) {
  const { data: order, error } = await supabase
    .from('stripe_orders')
    .select(
      'id, user_id, plan_id, billing_period, status, seat_count, unit_amount_cents, client_reference_id, stripe_subscription_id'
    )
    .eq('stripe_subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (error || !order) {
    console.error('Order not found for stripe_subscription_id:', subscriptionId, error)
    return null
  }
  return order
}

async function updateOrderStatus(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  payload: {
    status: 'completed'
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string
    stripe_subscription_id?: string
    stripe_customer_id?: string
    seat_count?: number
    unit_amount_cents?: number
  }
) {
  const updatePayload: Record<string, unknown> = {
    status: payload.status,
  }

  if (payload.stripe_checkout_session_id !== undefined) {
    updatePayload.stripe_checkout_session_id = payload.stripe_checkout_session_id
  }
  if (payload.stripe_payment_intent_id) {
    updatePayload.stripe_payment_intent_id = payload.stripe_payment_intent_id
  }
  if (payload.stripe_subscription_id) {
    updatePayload.stripe_subscription_id = payload.stripe_subscription_id
  }
  if (payload.stripe_customer_id) {
    updatePayload.stripe_customer_id = payload.stripe_customer_id
  }
  if (typeof payload.seat_count === 'number' && Number.isFinite(payload.seat_count) && payload.seat_count > 0) {
    updatePayload.seat_count = payload.seat_count
  }
  if (
    typeof payload.unit_amount_cents === 'number' &&
    Number.isFinite(payload.unit_amount_cents) &&
    payload.unit_amount_cents >= 0
  ) {
    updatePayload.unit_amount_cents = payload.unit_amount_cents
  }

  const { error } = await supabase.from('stripe_orders').update(updatePayload as any).eq('id', orderId)
  if (error) {
    console.error('Update order failed:', error)
  }
}

async function syncUserSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    userId: string
    planId: string
    billingPeriod: 'monthly' | 'yearly'
    subscriptionId?: string
    customerId?: string
    status?: 'active' | 'trialing' | 'past_due' | 'canceled'
    currentPeriodStart?: number | string
    currentPeriodEnd?: number | string
    cancelAtPeriodEnd?: boolean
  }
) {
  const startIso =
    toIsoString(payload.currentPeriodStart) ?? new Date().toISOString()
  const endIso =
    toIsoString(payload.currentPeriodEnd) ?? computePeriodEnd(startIso, payload.billingPeriod)

  const baseData = {
    plan_id: payload.planId,
    status: payload.status ?? 'active',
    current_period_start: startIso,
    current_period_end: endIso,
    cancel_at_period_end: payload.cancelAtPeriodEnd ?? false,
    stripe_subscription_id: payload.subscriptionId ?? null,
    stripe_customer_id: payload.customerId ?? null,
    billing_period: payload.billingPeriod,
  }

  let existingId: string | undefined

  if (payload.subscriptionId) {
    const { data: existingByStripe } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', payload.subscriptionId)
      .maybeSingle()
    if (existingByStripe?.id) {
      existingId = existingByStripe.id
    }
  }

  if (!existingId) {
    const { data: existingByUser } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', payload.userId)
      .order('updated_at', { ascending: false })
      .maybeSingle()
    if (existingByUser?.id) {
      existingId = existingByUser.id
    }
  }

  if (existingId) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update(baseData as any)
      .eq('id', existingId)
    if (error) {
      console.error('Update subscription failed:', error)
    }
  } else {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: payload.userId,
        ...baseData,
      } as any)

    if (error) {
      console.error('Insert subscription failed:', error)
    }
  }
}

function toIsoString(value?: number | string) {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') {
    // Stripe timestamps are in seconds
    return new Date(value * 1000).toISOString()
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

function computePeriodEnd(startIso: string, billingPeriod: 'monthly' | 'yearly') {
  const start = new Date(startIso)
  if (billingPeriod === 'yearly') {
    start.setFullYear(start.getFullYear() + 1)
  } else {
    start.setMonth(start.getMonth() + 1)
  }
  return start.toISOString()
}

function mapStripeSubscriptionStatus(status?: Stripe.Subscription.Status) {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'active'
  }
}

function getString(value: string | Stripe.Customer | Stripe.Subscription | null | undefined) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if ('id' in value) {
    return value.id
  }
  return undefined
}

async function retrieveStripeSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Failed to retrieve subscription', subscriptionId, error)
    return null
  }
}

function deriveBillingPeriodFromInvoice(invoice: Stripe.Invoice): 'monthly' | 'yearly' {
  const interval = invoice.lines.data[0]?.plan?.interval
  if (interval === 'year') return 'yearly'
  return 'monthly'
}


