import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  // セッション更新
  const response = await updateSession(request)

  // セッション更新後にユーザー認証をチェック
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // updateSession後のミドルウェアではクッキーを直接設定する必要はないが、
        // 他のロジックのためにスタブを残しています
        set(name: string, value: string, options) {
          // updateSession後のチェックでは無視されます
        },
        remove(name: string, options) {
          // updateSession後のチェックでは無視されます
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ユーザーがログインしていない場合で、現在のパスが/loginまたはAPI関連でない場合は
  // ログインページにリダイレクト
  if (
    !user &&
    request.nextUrl.pathname !== '/login' &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    request.nextUrl.pathname !== '/favicon.ico'
  ) {
    // トップページ（'/'）への未認証アクセスは許可
    if (request.nextUrl.pathname !== '/') {
        const loginUrl = new URL('/login', request.url)
        console.log(`未認証ユーザーを${request.nextUrl.pathname}から/loginへリダイレクト`);
        return NextResponse.redirect(loginUrl)
    }
  }

  return response
} 