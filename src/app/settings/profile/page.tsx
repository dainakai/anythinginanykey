// src/app/settings/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingName, setEditingName] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabaseクライアントの初期化とユーザー情報の取得
  useEffect(() => {
    const supabase = createClient();
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.user_metadata?.name) {
          setEditingName(user.user_metadata.name);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // auth状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.name) {
        setEditingName(session.user.user_metadata.name);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentName = user?.user_metadata?.name || '';
    if (!editingName.trim() || isUpdatingProfile || editingName.trim() === currentName) return;

    setIsUpdatingProfile(true);
    setProfileError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Supabaseセッションは自動更新されるため、改めて現在のユーザー情報を取得
      const supabase = createClient();
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);

      setSuccessMessage('プロフィール名を更新しました！');

    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(`プロフィールの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!user) {
    return <div>未認証です。ログインしてください。</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">プロフィール設定</h2>
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
            表示名
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <input
              type="text"
              id="profile-name"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-xs sm:text-sm border border-gray-300 rounded-md p-2"
              disabled={isUpdatingProfile}
            />
            <button
              type="submit"
              disabled={isUpdatingProfile || !editingName.trim() || editingName.trim() === user?.user_metadata?.name}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUpdatingProfile ? '保存中...' : '保存'}
            </button>
          </div>
          {profileError && <p className="text-red-500 text-sm mt-1">{profileError}</p>}
          {successMessage && <p className="text-green-600 text-sm mt-1">{successMessage}</p>}
        </div>

        {/* 他のプロフィール設定項目をここに追加 */}

      </form>
    </div>
  );
}
