'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Tag } from '@prisma/client';
import Link from 'next/link';

function TagManagementContent() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Tag[] = await response.json();
      setTags(data);
    } catch (e: unknown) {
      console.error('Failed to fetch tags:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`タグの読み込みに失敗しました: ${errorMessage}`);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTagName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!response.ok && response.status !== 200) { // Allow 200 if tag already exists
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) {
             // Handle cases where response is not valid JSON
             console.error("Failed to parse error response:", jsonError);
        }
        throw new Error(errorMsg);
      }

      // const createdOrExistingTag: Tag = await response.json(); // Can use this if needed
      setNewTagName(''); // Clear input
      await fetchTags(); // Refresh the tag list
      // Optionally show a success message, even if tag already existed

    } catch (e: unknown) {
      console.error('Failed to create tag:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`タグの作成に失敗しました: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`ユーザー定義タグ「${tagName}」を削除してもよろしいですか？\nこのタグはフレーズから削除されますが、フレーズ自体は削除されません。`)) {
      return;
    }

    setError(null);
    // Indicate loading state for the specific tag being deleted?
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      // Check for successful deletion (204 No Content)
      if (response.status === 204) {
         await fetchTags(); // Refresh the list on success
         // Optionally show a success message
      } else {
         // Handle other statuses (4xx, 5xx)
         let errorMsg = `HTTP error! status: ${response.status}`;
         try {
             const errorData = await response.json();
             errorMsg = errorData.error || errorMsg;
         } catch (jsonError) {
             console.error("Failed to parse error response:", jsonError);
         }
         throw new Error(errorMsg);
      }

    } catch (e: unknown) {
      console.error('Failed to delete tag:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`タグ「${tagName}」の削除に失敗しました: ${errorMessage}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">タグ管理</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ダッシュボードへ戻る
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">エラー: {error}</p>}

      {/* Create New Tag Form */}
      <form onSubmit={handleCreateTag} className="mb-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">新しいユーザー定義タグを作成</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="新しいタグ名"
            required
            className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newTagName.trim()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '作成中...' : '作成'}
          </button>
        </div>
         {/* Add feedback for tag creation, e.g., success or already exists */}
      </form>

      {/* Tag List */}
      <h2 className="text-2xl font-semibold mb-4">既存のタグ</h2>
      {loading && <p>読み込み中...</p>}
      {!loading && tags.length === 0 && <p>利用可能なタグはありません。</p>}
      {!loading && tags.length > 0 && (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タグ名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tag.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.type === 'preset' ?
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">プリセット</span>
                      :
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">ユーザー定義</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {tag.type === 'user_defined' && (
                      <button
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 transition duration-150 ease-in-out"
                        title={`ユーザー定義タグ「${tag.name}」を削除`}
                      >
                        削除
                      </button>
                    )}
                    {tag.type === 'preset' && (
                       <span className="text-gray-400 text-xs italic pr-4">削除不可</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TagManagementPage() {
    return (
      // Wrap with Suspense for potential future data fetching needs or component loading
      <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
        <TagManagementContent />
      </Suspense>
    );
  }
