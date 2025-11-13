import { createClient } from '@/lib/supabase/server'
import { rewriteText } from '@/lib/deepseek'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: '請輸入有效的文字' }, { status: 400 })
    }

    const result = await rewriteText(text)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Rewrite error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '改寫失敗' },
      { status: 500 }
    )
  }
}

