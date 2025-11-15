'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavLinkProps = {
  href: string
  label: string
}

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`rounded-lg px-2 py-2 text-base font-normal transition ${
        isActive
          ? 'bg-[#F5F5F5] text-[#1E1E1E]'
          : 'text-[#1E1E1E] hover:bg-[#F5F5F5]'
      }`}
    >
      {label}
    </Link>
  )
}

