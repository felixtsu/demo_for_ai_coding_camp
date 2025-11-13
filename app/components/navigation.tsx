import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

  return (
    <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-md shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-purple-500 text-sm font-semibold text-white shadow-md">
            AI
          </div>
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-sky-300"
          >
            文字改寫工具
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/rewrite"
                className="rounded-full px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-50/10 dark:hover:text-white"
              >
                改寫
              </Link>
              <span className="hidden rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm sm:inline dark:bg-slate-800/80 dark:text-slate-300">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 font-medium text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-50/10 dark:hover:text-white"
              >
                登入
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40"
              >
                註冊
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

