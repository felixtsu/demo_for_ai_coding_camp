'use client'

import { useState } from 'react'

type PricingToggleProps = {
  onToggle: (period: 'monthly' | 'yearly') => void
  defaultPeriod?: 'monthly' | 'yearly'
}

export function PricingToggle({ onToggle, defaultPeriod = 'monthly' }: PricingToggleProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(defaultPeriod)

  const handleToggle = (newPeriod: 'monthly' | 'yearly') => {
    setPeriod(newPeriod)
    onToggle(newPeriod)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => handleToggle('monthly')}
        className={`rounded-lg px-2 py-2 text-base font-normal transition-all duration-200 ${
          period === 'monthly'
            ? 'bg-[#F5F5F5] text-[#1E1E1E]'
            : 'text-[#1E1E1E] hover:bg-[#F5F5F5] hover:scale-[1.05] active:scale-[0.95]'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => handleToggle('yearly')}
        className={`rounded-lg px-2 py-2 text-base font-normal transition-all duration-200 ${
          period === 'yearly'
            ? 'bg-[#F5F5F5] text-[#1E1E1E]'
            : 'text-[#1E1E1E] hover:bg-[#F5F5F5] hover:scale-[1.05] active:scale-[0.95]'
        }`}
      >
        Yearly
      </button>
    </div>
  )
}

