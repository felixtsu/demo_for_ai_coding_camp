import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(searchParams.redirect || '/rewrite')
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 px-8 py-10 shadow-xl shadow-indigo-500/10 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="pointer-events-none absolute -right-20 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/30 via-sky-300/20 to-purple-300/20 blur-3xl" aria-hidden="true" />
        <div className="relative space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">欢迎回来</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              登录以继续使用高质量的 AI 改写工具。
            </p>
          </div>
          <LoginForm redirect={searchParams.redirect} />
        </div>
      </div>
    </div>
  )
}

