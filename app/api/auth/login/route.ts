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

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json(
        { error: '登录失败，未获取到会话' },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({ success: true, user: data.user })
    
    // Cookies are already set by the Supabase client via cookieStore
    return response
  } catch (error) {
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    )
  }
}

