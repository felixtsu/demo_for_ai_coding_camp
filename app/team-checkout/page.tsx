import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamCheckoutPageClient } from './team-checkout-page-client'

const TEAM_MIN_SEATS = 5

type SearchParams = {
  seats?: string
  period?: 'monthly' | 'yearly'
}

export default async function TeamCheckoutPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/team-checkout')
  }

  const seatsParam = Number(searchParams?.seats ?? TEAM_MIN_SEATS)
  const initialSeats = Number.isFinite(seatsParam) && seatsParam >= TEAM_MIN_SEATS ? Math.floor(seatsParam) : TEAM_MIN_SEATS
  const periodParam = searchParams?.period === 'yearly' ? 'yearly' : 'monthly'

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <TeamCheckoutPageClient
      initialSeats={initialSeats}
      initialPeriod={periodParam}
      publishableKey={publishableKey}
    />
  )
}


