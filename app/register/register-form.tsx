'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        // Email confirmation might be required
        setError('请检查您的邮箱以确认账户')
        setLoading(false)
        return
      }

      // Wait a moment for cookies to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.href = '/rewrite'
    } catch (err) {
      setError('注册失败，请重试')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-200">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/80 dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-600 dark:text-slate-200">
            密码
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/80 dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">密码至少 6 个字符</p>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? '注册中…' : '注册'}
      </button>
    </form>
  )
}

