import { createClient } from '@/lib/supabase/api'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '電郵地址和密碼都是必填項' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密碼至少需要 6 個字元' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.session) {
      // Email confirmation might be required
      return NextResponse.json({
        success: true,
        message: '請檢查您的電郵地址以確認帳戶',
        requiresConfirmation: true,
      })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    return NextResponse.json(
      { error: '註冊失敗，請再試一次' },
      { status: 500 }
    )
  }
}

