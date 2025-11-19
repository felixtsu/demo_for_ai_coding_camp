'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackGAEvent } from '@/lib/analytics/ga4-client'

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
      trackGAEvent('login', { method: 'email' })
      
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
          <div className="rounded-lg border border-[#D9D9D9] bg-[#F5F5F5] px-4 py-3 text-sm font-normal text-[#1E1E1E]">
            {error}
          </div>
        )}
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
            電郵地址
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] transition focus:border-[#1E1E1E] focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
            密碼
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] transition focus:border-[#1E1E1E] focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-3 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.02] active:scale-[0.98] active:bg-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100"
      >
        {loading ? '登入中…' : '登入'}
      </button>
    </form>
  )
}

