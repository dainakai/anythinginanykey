// src/auth/index.ts
// SupabaseAuth用のヘルパー
// NextAuth.jsからSupabaseへの移行をサポートする互換レイヤー

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as _createBrowserClient } from '@/utils/supabase/client';
import type { User as _User } from '@supabase/supabase-js';

// サーバーサイドでユーザー情報を取得
export async function getServerUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// サーバーサイドで認証が必要なAPIを保護するヘルパー
export async function requireAuth() {
  const user = await getServerUser();
  if (!user) {
    return { authorized: false, user: null };
  }
  return { authorized: true, user };
}

// セッション情報を取得（NextAuth互換）
export async function getSession() {
  const user = await getServerUser();
  if (!user) return null;
  
  return {
    user: {
      id: user.id,
      name: user.user_metadata?.full_name,
      email: user.email,
      image: user.user_metadata?.avatar_url,
    }
  };
}

// クライアントサイドのセッションフック（必要に応じて使用）
export function useSession() {
  // 必要に応じてクライアントサイドで実装
  return { data: null, status: 'unauthenticated' };
}

// エクスポート
export {
  getServerUser as getUser,
  requireAuth as withAuth
};