'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type RewriteUsage = {
  hasSubscription: boolean
  planId?: string
  planName?: string
  quota?: number
  remaining?: number
  renewsAt?: string
  used?: number
}

type RewriteFormProps = {
  initialUsage: RewriteUsage
}

const formatRenewalDate = (isoString?: string) => {
  if (!isoString) return null
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return null
  }
}

export function RewriteForm({ initialUsage }: RewriteFormProps) {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [usage, setUsage] = useState<RewriteUsage>(initialUsage)

  const quota = usage.quota ?? 0
  const remaining = usage.remaining ?? 0
  const used = usage.used ?? (quota > 0 ? quota - remaining : 0)
  const usageProgress = useMemo(
    () => (quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0),
    [quota, used]
  )
  const renewalDate = useMemo(() => formatRenewalDate(usage.renewsAt), [usage.renewsAt])
  const isQuotaDepleted = usage.hasSubscription && quota > 0 && remaining <= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return

    setError(null)
    setLoading(true)
    setOutputText('')

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '改寫失敗')
      }

      const data = await response.json()
      setOutputText(data.result)

      if (data.usage) {
        setUsage((prev) => ({
          ...prev,
          ...(data.usage as RewriteUsage),
        }))
      }

      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '改寫失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (copyError) {
      console.error('Copy failed', copyError)
      setError('複製失敗，請稍後再試')
    }
  }

  return (
    <section className="rounded-lg border border-[#D9D9D9] bg-white p-6 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="space-y-3 rounded-lg border border-[#D9D9D9] bg-white p-5">
            {usage.hasSubscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1E1E]">
                    {usage.planName ?? '訂閱方案'}
                  </span>
                  <span className="text-sm font-semibold text-[#1E1E1E]">
                    今日剩餘 {remaining}/{quota}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F5F5F5]">
                  <div
                    className="h-full rounded-full bg-[#1E1E1E] transition-all"
                    style={{ width: `${usageProgress}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-normal text-[#757575]">
                  <span>已使用 {used} 次</span>
                  {renewalDate && <span>週期結束：{renewalDate}</span>}
                </div>
                {isQuotaDepleted && (
                  <div className="rounded-lg border border-[#D9D9D9] bg-[#F5F5F5] px-3 py-2 text-xs font-normal text-[#1E1E1E]">
                    今日配額已用罄，您可以升級方案或等待配額重置。
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm font-normal text-[#757575]">
                  此功能僅限付費訂閱用戶使用，請先選擇適合您的方案。
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#767676] bg-[#E3E3E3] px-4 py-2 text-xs font-normal text-[#1E1E1E] transition hover:bg-[#D9D9D9]"
                >
                  查看方案
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="input-text" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
              輸入文字
            </label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              required
              placeholder="請輸入需要改寫的文字…"
              className="min-h-[240px] w-full resize-none rounded-lg border border-[#D9D9D9] bg-white px-5 py-4 text-base font-normal leading-[1.4] text-[#1E1E1E] transition focus:border-[#1E1E1E] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading || !inputText.trim() || !usage.hasSubscription || isQuotaDepleted}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-3 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.02] active:scale-[0.98] active:bg-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100"
            >
              {loading && (
                <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              )}
              {loading ? '改寫中…' : '開始改寫'}
            </button>
            <p className="text-sm font-normal text-[#757575]">
              支援貼上 Markdown、文章段落或任何需要潤飾的文字。
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-[#D9D9D9] bg-[#F5F5F5] px-4 py-3 text-sm font-normal text-[#1E1E1E]">
              {error}
            </div>
          )}
        </form>
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#757575]">
              改寫結果
            </h2>
            <div className="flex items-center gap-3">
              {copied && (
                <span className="text-xs font-normal text-[#757575]">已複製到剪貼簿</span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputText}
                className="inline-flex items-center gap-2 rounded-lg border border-[#767676] bg-[#E3E3E3] px-3 py-1.5 text-xs font-normal text-[#1E1E1E] transition-all duration-200 hover:bg-[#D9D9D9] hover:scale-[1.05] active:scale-[0.95] active:bg-[#CCCCCC] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
              >
                複製
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            rows={10}
            placeholder="改寫後的文字會在此顯示，支援直接複製或再次編輯。"
            className="min-h-[240px] w-full resize-none rounded-lg border border-[#D9D9D9] bg-[#F5F5F5] px-5 py-4 text-base font-normal leading-[1.4] text-[#1E1E1E] transition"
          />
        </div>
      </div>
    </section>
  )
}

