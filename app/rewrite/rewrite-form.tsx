'use client'

import { useState } from 'react'
import { rewriteText } from '@/lib/deepseek'

export function RewriteForm() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
        throw new Error(errorData.error || '改写失败')
      }

      const data = await response.json()
      setOutputText(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '改写失败，请重试')
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
      setError('复制失败，请稍后重试')
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 sm:p-10">
      <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/25 via-sky-300/15 to-purple-300/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-gradient-to-br from-rose-300/20 via-purple-200/15 to-blue-200/20 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-10 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="input-text" className="text-sm font-medium text-slate-600 dark:text-slate-200">
              输入文本
            </label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              required
              placeholder="请输入需要改写的文本..."
              className="min-h-[240px] w-full resize-none rounded-3xl border border-slate-200/70 bg-white/85 px-5 py-4 text-base leading-relaxed text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/80 dark:border-slate-700/70 dark:bg-slate-800/75 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
            />
          </div>
          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              )}
              {loading ? '改写中…' : '开始改写'}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              支持粘贴 markdown、文章段落或任何需要润色的文本。
            </p>
          </div>
          {error && (
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
        </form>
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              改写结果
            </h2>
            <div className="flex items-center gap-3">
              {copied && (
                <span className="text-xs font-medium text-emerald-500">已复制到剪贴板</span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputText}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-200"
              >
                复制
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            rows={10}
            placeholder="改写后的文本将显示在此，支持直接复制或二次编辑。"
            className="min-h-[240px] w-full resize-none rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 text-base leading-relaxed text-slate-800 shadow-inner transition dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-100"
          />
        </div>
      </div>
    </section>
  )
}

