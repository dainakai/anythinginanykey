'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AbcNotationRenderer from '@/components/AbcNotationRenderer';
import { Tag } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
// Assuming shadcn/ui is installed - import Switch
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

interface Phrase {
  id: string;
  abcNotation: string;
  originalKey: string;
  comment: string | null;
  createdAt: string;
  tags: Tag[];
  isPublic: boolean;
  // Add other necessary fields based on your API response
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPhrases: number;
  limit: number;
}

interface FilterInfo {
    availableTags: string[];
}

// Special value for the "untagged" filter
const UNTAGGED_FILTER_VALUE = '__untagged__';

// Extracted content that uses useSearchParams into its own component
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<FilterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPhraseId, setUpdatingPhraseId] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'createdAt_desc';

  const fetchPhrases = useCallback(async (page: number, tag: string, sort: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (tag) params.set('tag', tag);
    params.set('sort', sort);

    try {
      const response = await fetch(`/api/my-phrases?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPhrases(data.phrases);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (e: unknown) {
      console.error('Failed to fetch phrases:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`フレーズの読み込みに失敗しました: ${errorMessage}`);
      setPhrases([]);
      setPagination(null);
      setFilters(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhrases(currentPage, currentTag, currentSort);
  }, [currentPage, currentTag, currentSort, fetchPhrases]);

  const updateSearchParams = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    // Update or remove parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });

    // Reset page to 1 when filters or sort change
    if (newParams.tag !== undefined || newParams.sort !== undefined) {
        current.set('page', '1');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/dashboard${query}`);
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ tag: event.target.value });
  };

  const handleTagClick = (tagName: string) => {
    updateSearchParams({ tag: tagName });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ sort: event.target.value });
  };

  // --- Handle Publish Toggle ---
  const handlePublishToggle = async (phraseId: string, currentIsPublic: boolean) => {
    setUpdatingPhraseId(phraseId); // Set loading state for this specific phrase
    setError(null); // Clear previous errors

    const newIsPublic = !currentIsPublic;

    try {
      const response = await fetch(`/api/phrases/${phraseId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Update the local state to reflect the change immediately
      setPhrases(prevPhrases =>
        prevPhrases.map(p =>
          p.id === phraseId ? { ...p, isPublic: newIsPublic } : p
        )
      );

    } catch (e: unknown) {
        console.error('Failed to update phrase publish status:', e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Display error specific to this action, maybe near the switch?
        // For simplicity, using the general error state for now.
        setError(`公開状態の更新に失敗しました: ${errorMessage}`);
        // Revert UI optimistically if needed, or refetch data
    } finally {
        setUpdatingPhraseId(null); // Clear loading state for this phrase
    }
  };

  // The actual JSX structure
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">マイフレーズライブラリ</h1>
          <div className="flex items-center gap-4">
              {/* Link to Tag Management */}
              <Link href="/dashboard/tags" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                タグを管理
              </Link>
              {/* Add New Phrase Button */}
              <Link href="/phrases/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                新しいフレーズを作成
              </Link>
          </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div>
          <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mr-2">タグで絞り込み:</label>
          <select
            id="tag-filter"
            value={currentTag}
            onChange={handleTagChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">すべてのタグ</option>
            {/* Add the "Untagged" option */}
            <option value={UNTAGGED_FILTER_VALUE}>タグなし</option>
            {/* Separate divider or style if desired */}
            {filters?.availableTags?.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mr-2">並び順:</label>
          <select
            id="sort-order"
            value={currentSort}
            onChange={handleSortChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="createdAt_desc">新着順</option>
            <option value="createdAt_asc">古い順</option>
            {/* <option value="starCount_desc">人気順</option> */} {/* Uncomment when star count is implemented */}
          </select>
        </div>
      </div>

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && phrases.length === 0 && (
        <p>条件に一致するフレーズが見つかりません。</p>
      )}

      {!loading && !error && phrases.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {phrases.map((phrase) => {
                // Keep the parameters that achieved the desired density
                const engraverParams = { responsive: 'resize', staffwidth: 500 };
                const renderParams = { scale: 1.3 };
                const isUpdating = updatingPhraseId === phrase.id;

                return (
                  <div key={phrase.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow flex flex-col bg-white">
                    <h2 className="text-xl font-semibold mb-2 truncate">
                      {phrase.abcNotation.match(/T:\s*(.*)/)?.[1] || '無題のフレーズ'}
                    </h2>
                    <div className="mb-3 w-full">
                      <AbcNotationRenderer
                        key={`${phrase.id}-preview`}
                        abcNotation={phrase.abcNotation}
                        renderParams={renderParams}
                        engraverParams={engraverParams}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">キー: {phrase.originalKey}</p>
                    {phrase.comment && <p className="text-sm text-gray-700 mb-2 truncate">コメント: {phrase.comment}</p>}
                    <div className="mb-3">
                      {phrase.tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.name)}
                          className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                          title={`タグ「${tag.name}」で絞り込む`}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                    {/* --- Publish Toggle Checkbox --- */}
                    <div className="flex items-center space-x-2 mt-4 mb-3">
                       <input
                         type="checkbox"
                         id={`publish-checkbox-${phrase.id}`}
                         checked={phrase.isPublic}
                         onChange={() => handlePublishToggle(phrase.id, phrase.isPublic)}
                         disabled={isUpdating} // Disable while updating
                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                       />
                       <label htmlFor={`publish-checkbox-${phrase.id}`} className={`text-sm ${isUpdating ? 'text-gray-400' : 'text-gray-600'}`}>
                         {isUpdating ? '更新中...' : (phrase.isPublic ? '公開中' : '非公開')}
                       </label>
                     </div>
                    {/* ----------------------------- */}
                    <p className="text-xs text-gray-500 mb-3">登録日時: {new Date(phrase.createdAt).toLocaleString()}</p>
                    <Link href={`/phrases/${phrase.id}`} className="text-blue-600 hover:underline mt-auto self-start">
                      詳細を見る
                    </Link>
                  </div>
                );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

// The main page component now wraps DashboardContent in Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
