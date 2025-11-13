import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/rewrite')
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 px-8 py-10 shadow-xl shadow-indigo-500/10 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-300/20 to-purple-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">创建新账号</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              注册后即可无限制使用文本改写与语气优化功能。
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

