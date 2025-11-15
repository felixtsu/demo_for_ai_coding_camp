import { createClient } from '@/lib/supabase/server'
import { getRewriteUsageSummary } from '@/lib/rewrite/access'
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

  const usageSummary = await getRewriteUsageSummary(supabase, user.id)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-16 py-16">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-4xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
          文字改寫工作台
        </h1>
        <p className="text-xl font-normal leading-[1.4] text-[#757575]">
          輸入需要優化的段落，我們會在保留原始語義的基礎上，讓表達更自然、更有說服力。
        </p>
      </header>
      <RewriteForm initialUsage={usageSummary} />
    </div>
  )
}

