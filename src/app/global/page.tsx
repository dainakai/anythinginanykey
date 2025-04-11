'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AbcNotationRenderer from '@/components/AbcNotationRenderer';
import { Tag } from '@prisma/client'; // Assuming Tag type is available
import PaginationControls from '@/components/PaginationControls';
import Image from 'next/image'; // Import next/image
import { createClient } from '@/utils/supabase/client'; // Use new util path
import type { User } from '@supabase/supabase-js'; // Import Supabase User type

// Define interface based on /api/phrases/global response
interface GlobalPhrase {
  id: string;
  abcNotation: string;
  originalKey: string;
  comment: string | null;
  createdAt: string;
  tags: Tag[];
  starCount: number; // Added star count
  user: { // Added author info
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  userHasStarred?: boolean; // Optional, indicates if the current logged-in user starred this
  // isPublic is implicitly true for global phrases
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

function GlobalPhrasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: userLoading } = useSupabaseUser(); // Get Supabase user

  const [phrases, setPhrases] = useState<GlobalPhrase[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<FilterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starringStatus, setStarringStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});
  const [forkingStatus, setForkingStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'createdAt_desc'; // Default sort: newest

  const fetchGlobalPhrases = useCallback(async (page: number, tag: string, sort: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (tag) params.set('tag', tag);
    params.set('sort', sort);

    // Pass current user ID to fetch starred status (if API supports it)
    if (currentUser?.id) {
      params.set('userId', currentUser.id);
    }

    try {
      const response = await fetch(`/api/phrases/global?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPhrases(data.phrases);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (e: unknown) {
      console.error('Failed to fetch global phrases:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`フレーズの読み込みに失敗しました: ${errorMessage}`);
      setPhrases([]);
      setPagination(null);
      setFilters(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchGlobalPhrases(currentPage, currentTag, currentSort);
  }, [currentPage, currentTag, currentSort, fetchGlobalPhrases]);

  // --- Search Param Update Logic (Similar to Dashboard) ---
  const updateSearchParams = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      current.set(key, value || ''); // Ensure value is string
    });
    if (newParams.tag !== undefined || newParams.sort !== undefined) {
        current.set('page', '1');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/global${query}`); // Navigate to /global
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

  // --- Star Toggle Handler (use currentUser) ---
  const handleStarToggle = async (phraseId: string, currentStarredStatus: boolean) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setStarringStatus(prev => ({ ...prev, [phraseId]: { loading: true, error: null } }));
    const method = currentStarredStatus ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`/api/phrases/${phraseId}/star`, { method });
      if (!response.ok) {
        throw await response.json();
      }
      const result = await response.json();
      // Update phrase in local state
      setPhrases(prev => prev.map(p => p.id === phraseId ? { ...p, userHasStarred: !currentStarredStatus, starCount: result.starCount } : p));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setStarringStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: errorMessage } }));
    } finally {
      setStarringStatus(prev => ({ ...prev, [phraseId]: { ...prev[phraseId], loading: false } }));
    }
  };

  // --- Fork Handler (use currentUser) ---
  const handleFork = async (phraseId: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setForkingStatus(prev => ({ ...prev, [phraseId]: { loading: true, error: null } }));
    try {
      const response = await fetch(`/api/phrases/${phraseId}/fork`, { method: 'POST' });
      if (!response.ok) {
        throw await response.json();
      }
      const forkedPhrase = await response.json();
      router.push(`/phrases/${forkedPhrase.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setForkingStatus(prev => ({ ...prev, [phraseId]: { loading: false, error: errorMessage } }));
    } finally {
      setForkingStatus(prev => ({ ...prev, [phraseId]: { ...prev[phraseId], loading: false } }));
    }
  };

  if (loading || userLoading) {
    return <div>Loading phrases...</div>; // Combined loading state
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">グローバルライブラリ</h1>
          {/* Maybe add link back to dashboard or other actions? */}
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
            <option value="createdAt_desc">新着順</option>
            <option value="starCount_desc">人気順 (スター数)</option> {/* Added sort by stars */}
            {/* Add other sort options like createdAt_asc if needed */}
          </select>
        </div>
      </div>

      {!loading && phrases.length === 0 && (
        <p>条件に一致する公開フレーズが見つかりません。</p>
      )}

      {!loading && phrases.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {phrases.map((phrase) => {
                const engraverParams = { responsive: 'resize', staffwidth: 500 };
                const renderParams = { scale: 1.3 };
                const starStatus = starringStatus[phrase.id] || { loading: false, error: null };
                const forkStatus = forkingStatus[phrase.id] || { loading: false, error: null };
                const isOwnPhrase = currentUser?.id === phrase.user?.id; // Check if it's user's own phrase

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

                    {/* Author Info */}
                    {phrase.user && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            {/* Basic image placeholder or use Next/Image if configured */}
                            {phrase.user.image ? (
                                <Image src={phrase.user.image} alt={phrase.user.name || 'Author'} width={20} height={20} className="rounded-full" />
                            ) : (
                                <span className="h-5 w-5 rounded-full bg-gray-300 inline-block"></span> // Placeholder
                            )}
                            <span>{phrase.user.name || '匿名ユーザー'}</span>
                        </div>
                    )}

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

                    <div className="flex justify-between items-center mt-3">
                        {/* Star Count Display & Button */}
                        <button
                            onClick={() => handleStarToggle(phrase.id, phrase.userHasStarred ?? false)}
                            disabled={!currentUser || starStatus.loading} // Disable if not logged in or loading
                            className={`flex items-center px-2 py-1 border rounded transition-colors text-sm disabled:opacity-50 ${!currentUser ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                            aria-label="スターを付ける/外す"
                            title={currentUser ? "スターを付ける/外す" : "ログインが必要です"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${starStatus.loading ? 'animate-spin text-gray-400' : (phrase.userHasStarred ? 'text-yellow-500' : 'text-gray-400')}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{starStatus.loading ? '...' : (phrase.starCount ?? 0)}</span>
                        </button>

                        {/* --- Fork Button (Show if logged in and not own phrase) --- */}
                        {currentUser && !isOwnPhrase && (
                            <button
                                onClick={() => handleFork(phrase.id)}
                                disabled={forkStatus.loading}
                                className="flex items-center px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                aria-label="このフレーズをフォークする"
                                title="自分のライブラリにコピーする"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${forkStatus.loading ? 'animate-spin text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span>{forkStatus.loading ? '...' : 'フォーク'}</span>
                            </button>
                        )}
                        {/* -------------------------------------------------------- */}

                        <Link href={`/phrases/${phrase.id}`} className="text-blue-600 hover:underline text-sm">
                          詳細を見る
                        </Link>
                    </div>
                    {/* Display Fork Error per card */}
                     {forkStatus.error && (
                       <p className="text-xs text-red-500 mt-1">{forkStatus.error}</p>
                   )}
                    {/* Display Star Error per card */}
                    {starStatus.error && (
                        <p className="text-xs text-red-500 mt-1">{starStatus.error}</p>
                    )}
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

export default function GlobalPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
      <GlobalPhrasesContent />
    </Suspense>
  );
}
