import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NavLink } from './nav-link'

export async function Navigation() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const navItems = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[#D9D9D9] bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-6 px-8 py-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E1E] text-sm font-semibold text-white">
            AI
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.label} href={item.href} label={item.label} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/rewrite"
                className="rounded-lg border border-[#767676] bg-[#E3E3E3] px-2 py-2 text-base font-normal text-[#1E1E1E] transition-all duration-200 hover:bg-[#D9D9D9] hover:scale-[1.05] active:scale-[0.95] active:bg-[#CCCCCC]"
              >
                改寫
              </Link>
              <span className="hidden rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm sm:inline dark:bg-slate-800/80 dark:text-slate-300">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-2 py-2 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.05] active:scale-[0.95] active:bg-[#0F0F0F]"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-[#767676] bg-[#E3E3E3] px-2 py-2 text-base font-normal text-[#1E1E1E] transition-all duration-200 hover:bg-[#D9D9D9] hover:scale-[1.05] active:scale-[0.95] active:bg-[#CCCCCC]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-2 py-2 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.05] active:scale-[0.95] active:bg-[#0F0F0F]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

