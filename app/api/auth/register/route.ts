import { createClient } from '@/lib/supabase/api'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码都是必填项' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要 6 个字符' },
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
        message: '请检查您的邮箱以确认账户',
        requiresConfirmation: true,
      })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    return NextResponse.json(
      { error: '注册失败，请重试' },
      { status: 500 }
    )
  }
}

