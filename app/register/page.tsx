import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/rewrite')
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-16 py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-6 rounded-lg border border-[#D9D9D9] bg-white px-8 py-10">
          <div className="text-center">
            <h1 className="text-3xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">建立新帳戶</h1>
            <p className="mt-2 text-base font-normal leading-[1.4] text-[#757575]">
              註冊後即可無限制使用文字改寫與語氣優化功能。
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

