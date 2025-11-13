import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RewriteForm } from './rewrite-form'

export default async function RewritePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/rewrite')
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="space-y-3 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 ring-1 ring-indigo-500/30 dark:bg-indigo-400/10 dark:text-indigo-200">
          Rewrite
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          文字改寫工作台
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          輸入需要優化的段落，我們會在保留原始語義的基礎上，讓表達更自然、更有說服力。
        </p>
      </header>
      <RewriteForm />
    </div>
  )
}

