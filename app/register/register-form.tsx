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
        setError('請檢查您的電郵地址以確認帳戶')
        setLoading(false)
        return
      }

      // Wait a moment for cookies to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.href = '/rewrite'
    } catch (err) {
      setError('註冊失敗，請再試一次')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="rounded-lg border border-[#D9D9D9] bg-[#F5F5F5] px-4 py-3 text-sm font-normal text-[#1E1E1E]">
          {error}
        </div>
      )}
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] transition focus:border-[#1E1E1E] focus:outline-none"
          />
          <p className="text-sm font-normal text-[#757575]">密碼至少 6 個字元</p>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-3 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.02] active:scale-[0.98] active:bg-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100"
      >
        {loading ? '註冊中…' : '註冊'}
      </button>
    </form>
  )
}

