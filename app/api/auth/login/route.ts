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
        { error: '登入失敗，未能取得工作階段' },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({ success: true, user: data.user })
    
    // Cookies are already set by the Supabase client via cookieStore
    return response
  } catch (error) {
    return NextResponse.json(
      { error: '登入失敗，請再試一次' },
      { status: 500 }
    )
  }
}

