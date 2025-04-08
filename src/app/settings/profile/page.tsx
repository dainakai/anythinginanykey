// src/app/settings/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession(); // `update` 関数を取得
  const [editingName, setEditingName] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setEditingName(session.user.name);
    }
  }, [session]);

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingName.trim() || isUpdatingProfile || editingName.trim() === session?.user?.name) return;

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

      // セッション情報を更新
      await update({ name: editingName.trim() });

      setSuccessMessage('プロフィール名を更新しました！');

    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(`プロフィールの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!session) {
    return <div>読み込み中または未認証...</div>; // 認証状態のハンドリング
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
              disabled={isUpdatingProfile || !editingName.trim() || editingName.trim() === session.user?.name}
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
