'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AbcNotationRenderer from '@/components/AbcNotationRenderer';
import { Tag } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';


// Interface for starred phrases (similar to GlobalPhrase, but userHasStarred is implicitly true)
interface StarredPhrase {
  id: string;
  abcNotation: string;
  originalKey: string;
  comment: string | null;
  createdAt: string;
  tags: Tag[];
  starCount: number;
  isPublic: boolean;
  userId: string; // just the userId for mapping to Supabase user
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

const UNTAGGED_FILTER_VALUE = '__untagged__';

// Helper function to get user (client-side)
function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // Create client instance

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]); // Dependency array includes supabase instance

  return { user, loading };
}

function StarredPhrasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: userLoading } = useSupabaseUser();

  const [phrases, setPhrases] = useState<StarredPhrase[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<FilterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for star/fork actions (similar to global page)
  const [starringStatus, setStarringStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});
  const [forkingStatus, setForkingStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'starredAt_desc'; // Default sort: recently starred

  const fetchStarredPhrases = useCallback(async (page: number, tag: string, sort: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (tag) params.set('tag', tag);
    params.set('sort', sort);

    try {
      // Use the starred phrases API endpoint
      const response = await fetch(`/api/user/starred-phrases?${params.toString()}`);
      if (!response.ok) {
          if (response.status === 401) {
               throw new Error('ログインが必要です。');
          }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPhrases(data.phrases);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (e: unknown) {
      console.error('Failed to fetch starred phrases:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`スター付きフレーズの読み込みに失敗しました: ${errorMessage}`);
      setPhrases([]);
      setPagination(null);
      setFilters(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStarredPhrases(currentPage, currentTag, currentSort);
  }, [currentPage, currentTag, currentSort, fetchStarredPhrases]);

  // --- Search Param Update Logic ---
  const updateSearchParams = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });
    if (newParams.tag !== undefined || newParams.sort !== undefined) {
        current.set('page', '1');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/dashboard/starred${query}`); // Navigate to /dashboard/starred
  };

  // --- Handlers (PageChange, TagChange, TagClick, SortChange) - Same as global/dashboard ---
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

  // --- Star Toggle Handler (Same logic as global, but assumes initially starred) ---
   const handleStarToggle = async (phraseId: string, _currentStarCount: number) => {
    if (!currentUser) {
      alert('操作にはログインが必要です。');
      router.push('/login');
      return;
    }

    setStarringStatus(prev => ({ ...prev, [phraseId]: { loading: true, error: null } }));

    // Assume currently starred, so try DELETE first
    const method = 'DELETE';

    try {
        const response = await fetch(`/api/phrases/${phraseId}/star`, { method });

        if (!response.ok) {
            const errorData = await response.json();
             // If DELETE fails (e.g., 404 not found - maybe already unstarred?), handle it.
             // For simplicity, just throw for now.
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // Remove phrase from list immediately upon successful unstar
        setPhrases(prev => prev.filter(p => p.id !== phraseId));
        // Optionally update pagination info if needed, or refetch the whole list

    } catch (error) {
        console.error('Error toggling star on starred list:', error);
        setStarringStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: `スター解除失敗: ${error instanceof Error ? error.message : String(error)}` } }));
    } finally {
         setStarringStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: prev[phraseId]?.error } }));
    }
};

  // --- Fork Handler (Same logic as global) ---
   const handleFork = async (phraseId: string) => {
    if (!currentUser) {
        alert('フレーズをフォークするにはログインが必要です。');
        router.push('/login');
        return;
    }

    setForkingStatus(prev => ({ ...prev, [phraseId]: { loading: true, error: null } }));

    try {
        const response = await fetch(`/api/phrases/${phraseId}/fork`, { method: 'POST' });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const _forkedPhrase = await response.json();
        alert('フレーズをライブラリにフォークしました！');
        setForkingStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: null } }));

    } catch (error) {
        console.error('Error forking phrase from starred list:', error);
        setForkingStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: `フォーク失敗: ${error instanceof Error ? error.message : String(error)}` } }));
    }
};


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">スター付きフレーズ</h1>
           <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボードへ戻る</Link>
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
            <option value={UNTAGGED_FILTER_VALUE}>タグなし</option>
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
            <option value="starredAt_desc">最近スターした順</option>
            <option value="starCount_desc">人気順 (スター数)</option>
            <option value="createdAt_desc">フレーズ作成日順</option>
          </select>
        </div>
      </div>

      {(loading || userLoading) && <p>読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && phrases.length === 0 && (
        <p>スターを付けたフレーズが見つかりません。</p>
      )}

      {!loading && !error && phrases.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {phrases.map((phrase) => {
                const engraverParams = { responsive: 'resize', staffwidth: 500 };
                const renderParams = { scale: 1.3 };
                const starStatus = starringStatus[phrase.id] || { loading: false, error: null };
                const forkStatus = forkingStatus[phrase.id] || { loading: false, error: null };
                const isOwnPhrase = currentUser?.id === phrase.userId;

                return (
                  <div key={phrase.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow flex flex-col bg-white">
                    {/* Card Content (Title, Renderer, Key, Comment, Author, Tags) - Same as global */}
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
                     {/* 作者情報表示（Supabaseではresolveする必要あり） */}
                     <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <span className="h-5 w-5 rounded-full bg-gray-300 inline-block"></span>
                        <span>{phrase.userId}</span>
                     </div>
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
                    {/* ------------------------------------------------------------------------- */}

                    <div className="flex justify-between items-center mt-auto pt-3 border-t">
                         {/* Star Button (Here, clicking always means unstar) */}
                         <button
                            onClick={() => handleStarToggle(phrase.id, phrase.starCount)}
                            disabled={!currentUser || starStatus.loading}
                            className={`flex items-center px-2 py-1 border rounded transition-colors text-sm disabled:opacity-50 ${!currentUser ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'border-yellow-500 bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                            aria-label="スターを外す"
                            title={currentUser ? "スターを外す" : "ログインが必要です"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${starStatus.loading ? 'animate-spin text-gray-400' : 'text-yellow-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{phrase.starCount}</span>
                            {starStatus.loading && <span className="ml-1 text-xs">(...)</span>}
                        </button>

                         {/* Fork Button (Show if logged in and not own phrase) */}
                         {!isOwnPhrase && currentUser && (
                            <button
                                onClick={() => handleFork(phrase.id)}
                                disabled={forkStatus.loading}
                                className="flex items-center px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="自分のライブラリにコピーする"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${forkStatus.loading ? 'animate-spin text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span>{forkStatus.loading ? '...' : 'フォーク'}</span>
                            </button>
                        )}

                        <Link href={`/phrases/${phrase.id}`} className="text-blue-600 hover:underline text-sm">
                          詳細
                        </Link>
                    </div>
                     {/* Display Action Errors per card */}
                      {starStatus.error && (
                        <p className="text-xs text-red-500 mt-1">{starStatus.error}</p>
                    )}
                    {forkStatus.error && (
                       <p className="text-xs text-red-500 mt-1">{forkStatus.error}</p>
                   )}
                  </div>
                );
            })}
          </div>
          {/* Pagination Controls */}
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

// Main component using Suspense
export default function StarredPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
      <StarredPhrasesContent />
    </Suspense>
  );
}
