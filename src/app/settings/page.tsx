// src/app/settings/page.tsx
// import { createClient } from '@/utils/supabase/server'; // 未使用のため削除
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function SettingsPage() {
  // const supabase = await createClient(); // 未使用のため削除
  // デフォルトでプロフィール設定ページにリダイレクト
  redirect('/settings/profile');

  // リダイレクトされるため、ここは通常表示されない
  return null;
}
