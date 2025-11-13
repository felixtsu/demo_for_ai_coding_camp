'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ redirect }: { redirect?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate inputs
    if (!email || !password) {
      setError('請輸入電郵地址和密碼')
      setLoading(false)
      return
    }

    try {
      const trimmedEmail = email.trim()
      console.log('Attempting login with email:', trimmedEmail, 'password length:', password.length)
      
      if (!trimmedEmail || !password) {
        setError('電郵地址和密碼不能為空')
        setLoading(false)
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      })

      if (signInError) {
        console.error('Login error:', signInError)
        setError(signInError.message || '登入失敗，請檢查電郵地址和密碼')
        setLoading(false)
        return
      }

      if (!data.session) {
        console.error('No session received')
        setError('登入失敗，未能取得工作階段')
        setLoading(false)
        return
      }

      console.log('Login successful, session:', data.session)
      
      // Wait a bit for session to be stored
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force a full page reload to ensure cookies are synced
      // Then the middleware will detect auth state and redirect
      const targetUrl = redirect || '/rewrite'
      window.location.href = targetUrl
    } catch (err) {
      console.error('Login exception:', err)
      setError('登入失敗，請再試一次')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div aria-live="assertive" className="space-y-2">
        {error && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-200">
            電郵地址
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
            密碼
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/80 dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? '登入中…' : '登入'}
      </button>
    </form>
  )
}

