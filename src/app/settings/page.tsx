// src/app/settings/page.tsx
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // デフォルトでプロフィール設定ページにリダイレクト
  redirect('/settings/profile');

  // リダイレクトされるため、ここは通常表示されない
  return null;
}
