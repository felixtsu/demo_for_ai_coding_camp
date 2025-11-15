import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(searchParams.redirect || '/rewrite')
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-16 py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-6 rounded-lg border border-[#D9D9D9] bg-white px-8 py-10">
          <div className="text-center">
            <h1 className="text-3xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">歡迎回來</h1>
            <p className="mt-2 text-base font-normal leading-[1.4] text-[#757575]">
              登入以繼續使用高質素的 AI 改寫工具。
            </p>
          </div>
          <LoginForm redirect={searchParams.redirect} />
        </div>
      </div>
    </div>
  )
}

