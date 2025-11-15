import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/app/components/hero-section'
import { Footer } from '@/app/components/footer'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/rewrite')
  }

  return (
    <>
      <HeroSection title="去除 AI 味道" subtitle="讓每一段文字都像你親手寫的" />
      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-16 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
            去除 AI 味道，讓每一段文字都像你親手寫的
          </h2>
          <p className="max-w-2xl text-xl font-normal leading-[1.4] text-[#757575]">
            輕鬆貼上文字，借助智能語氣調節與語義潤飾，在保持原意的基礎上創作自然流暢的內容，適用於文章改寫、品牌文案和學術場景。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-3 text-base font-normal text-white transition-all duration-200 hover:bg-[#1E1E1E] hover:scale-[1.02] active:scale-[0.98] active:bg-[#0F0F0F]"
            >
              立即免費體驗
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-[#767676] bg-[#E3E3E3] px-6 py-3 text-base font-normal text-[#1E1E1E] transition-all duration-200 hover:bg-[#D9D9D9] hover:scale-[1.02] active:scale-[0.98] active:bg-[#CCCCCC]"
            >
              已有帳戶？登入
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: '寫作助手',
              description: '智能識別原文意圖，重新組織結構，避免 AI 檢測提示。',
            },
            {
              title: '多場景適配',
              description: '支援營銷文案、論文摘要、社交媒體帖子等一鍵切換語氣。',
            },
            {
              title: '團隊協作',
              description: '儲存常用模版並與團隊分享，保持品牌語氣一致。',
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col gap-4 rounded-lg border border-[#D9D9D9] bg-white p-6"
            >
              <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
                {feature.title}
              </h3>
              <p className="text-base font-normal leading-[1.4] text-[#757575]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </>
  )
}

