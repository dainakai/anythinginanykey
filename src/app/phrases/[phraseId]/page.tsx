'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import dynamic from 'next/dynamic';
import Link from 'next/link'; // Import Link for navigation
import { useSession } from 'next-auth/react'; // Import useSession to get user data

// Helper function to get semitone offset from C
// Handles key notations like "C", "Gm", "Bb", "F#m", etc.
const keyToSemitoneOffset: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'Fb': 4, 'E#': 5, 'F': 5,
    'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11, 'B#': 0
};

const normalizeKey = (key: string): string => {
    // Remove minor indicator 'm' and anything after it (e.g., " mix")
    const baseKey = key.replace(/m.*$/, '').trim();
    // Handle sharps and flats
    if (baseKey.endsWith('#')) {
        return baseKey.slice(0, 2);
    } else if (baseKey.endsWith('b')) {
        return baseKey.slice(0, 2);
    } else {
        return baseKey.slice(0, 1);
    }
};

const getTransposeAmount = (originalKey: string, targetKey: string): number => {
    const originalNormalized = normalizeKey(originalKey);
    const targetNormalized = normalizeKey(targetKey);

    const originalOffset = keyToSemitoneOffset[originalNormalized];
    const targetOffset = keyToSemitoneOffset[targetNormalized];

    if (originalOffset === undefined || targetOffset === undefined) {
        console.warn(`Could not determine semitone offset for keys: ${originalKey} (${originalNormalized}) or ${targetKey} (${targetNormalized})`);
        return 0; // Default to no transposition if key is unknown
    }

    const difference = targetOffset - originalOffset;
    // Ensure the difference is within the -11 to 11 range if needed,
    // but abcjs handles larger numbers correctly (wraps around).
    // difference = difference > 6 ? difference - 12 : difference;
    // difference = difference < -6 ? difference + 12 : difference;
    return difference;
};

// Define the 12 keys for transposition display (using common flats for display)
const displayKeys = [
    'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

// Dynamically import the renderer component, disabling SSR
const AbcNotationRenderer = dynamic(() => import('@/components/AbcNotationRenderer'), {
    ssr: false,
    loading: () => <p>Loading renderer...</p> // Optional loading indicator
});

// Update PhraseData interface to include comments and potentially userHasStarred
interface CommentData {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface PhraseData {
    id: string;
    abcNotation: string;
    originalKey: string;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null; // Added image for consistency
    } | null;
    tags: { name: string }[];
    starCount: number; // Assuming API provides this
    isPublic: boolean; // Assuming API provides this
    comments: CommentData[]; // Add comments array
    userHasStarred?: boolean; // Optional: Provided by API
}

const PhraseDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter(); // Initialize useRouter
    const { data: session } = useSession(); // Get session data
    const loggedInUserId = session?.user?.id;
    const phraseId = params?.phraseId as string; // Get phrase ID using the directory name

    const [phraseData, setPhraseData] = useState<PhraseData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string>('');
    const [renderError, setRenderError] = useState<Error | null>(null); // State for rendering error
    const [isDeleting, setIsDeleting] = useState<boolean>(false); // State for deletion status
    const [deleteError, setDeleteError] = useState<string>(''); // State for deletion error
    const [newCommentContent, setNewCommentContent] = useState<string>('');
    const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [isStarrting, setIsStarrting] = useState<boolean>(false);
    const [starError, setStarError] = useState<string | null>(null);
    const [isForking, setIsForking] = useState<boolean>(false);
    const [forkError, setForkError] = useState<string | null>(null);

    // --- Fetch phrase data --- (Runs once on mount)
    useEffect(() => {
        if (!phraseId) {
            setLoadError('Invalid Phrase ID.');
            setIsLoading(false);
            return;
        }

        const fetchPhrase = async () => {
            setIsLoading(true);
            setLoadError('');
            setDeleteError(''); // Reset delete error on fetch
            try {
                const response = await fetch(`/api/phrases/${phraseId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 403 || response.status === 404) {
                        throw new Error('フレーズが見つからないか、アクセス権がありません。');
                    } else {
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                }
                const data: PhraseData = await response.json();
                setPhraseData(data);

            } catch (error) {
                console.error('Error fetching phrase:', error);
                setLoadError(`データの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPhrase();
    }, [phraseId]);

    // --- Error handling for the renderer ---
    const handleRenderError = (error: Error | null) => {
        setRenderError(error);
    };

    // --- Delete handler ---
    const handleDelete = async () => {
        if (!phraseId || isDeleting) {
            return;
        }

        const confirmed = window.confirm('このフレーズを本当に削除しますか？');
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            const response = await fetch(`/api/phrases/${phraseId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle specific errors like 404 Not Found or 403 Forbidden
                if (response.status === 404 || response.status === 403) {
                    throw new Error('フレーズが見つからないか、削除する権限がありません。');
                } else {
                     const errorData = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty obj
                     throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
            }

            // On successful deletion (status 204 No Content or similar)
            alert('フレーズが削除されました。');
            router.push('/'); // Redirect to home/dashboard page after deletion
            // Alternatively, router.back(); could be used

        } catch (error) {
            console.error('Error deleting phrase:', error);
            setDeleteError(`削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Comment Submit Handler ---
    const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newCommentContent.trim() || isSubmittingComment || !phraseId) {
            return;
        }

        setIsSubmittingComment(true);
        setCommentError(null);

        try {
            const response = await fetch(`/api/phrases/${phraseId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newCommentContent.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const newComment: CommentData = await response.json();

            // Add the new comment to the local state
            setPhraseData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    comments: [...prevData.comments, newComment],
                };
            });

            setNewCommentContent(''); // Clear the input field

        } catch (error) {
            console.error('Error submitting comment:', error);
            setCommentError(`コメントの送信に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // --- Star Toggle Handler ---
    const handleStarToggle = async () => {
        if (!session || !phraseData || isStarrting) return; // Need session and phrase data

        setIsStarrting(true);
        setStarError(null);

        const currentlyStarred = phraseData.userHasStarred;
        const method = currentlyStarred ? 'DELETE' : 'POST';

        // Optimistic UI update
        setPhraseData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                userHasStarred: !currentlyStarred,
                starCount: currentlyStarred ? prevData.starCount - 1 : prevData.starCount + 1,
            };
        });

        try {
            const response = await fetch(`/api/phrases/${phraseId}/star`, { method });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            // Update with the actual star count from the server for consistency
            setPhraseData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    starCount: result.starCount,
                };
            });

        } catch (error) {
            console.error('Error toggling star:', error);
            setStarError(`スター状態の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            // Revert optimistic update on error
            setPhraseData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    userHasStarred: currentlyStarred, // Revert star status
                    starCount: currentlyStarred ? prevData.starCount + 1 : prevData.starCount - 1, // Revert count (approximate)
                    // Ideally, refetch phrase data here for guaranteed consistency
                };
            });
        } finally {
            setIsStarrting(false);
        }
    };

    // --- Fork Handler ---
    const handleFork = async () => {
        if (!session || !phraseId || isForking) return;

        setIsForking(true);
        setForkError(null);

        try {
            const response = await fetch(`/api/phrases/${phraseId}/fork`, { method: 'POST' });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const forkedPhrase = await response.json();
            alert('フレーズをライブラリにフォークしました！');
            // Redirect to the newly forked phrase's detail page or dashboard
            router.push(`/phrases/${forkedPhrase.id}`); // Go to the new phrase
            // Or router.push('/dashboard');

        } catch (error) {
            console.error('Error forking phrase:', error);
            setForkError(`フォークに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsForking(false);
        }
    };

    // Determine if the current user is the owner
    const isOwner = !!session && !!phraseData && phraseData.user?.id === loggedInUserId;

    // --- Render Logic ---
    if (isLoading) {
        return <div className="container mx-auto p-4">読み込み中...</div>;
    }

    if (loadError) {
        return <div className="container mx-auto p-4 text-red-500">エラー: {loadError}</div>;
    }

    if (!phraseData) {
        return <div className="container mx-auto p-4">フレーズが見つかりません。</div>;
    }

    // Format dates (basic example)
    const formattedCreatedAt = phraseData.createdAt ? new Date(phraseData.createdAt).toLocaleString('ja-JP') : '不明';
    const formattedUpdatedAt = phraseData.updatedAt ? new Date(phraseData.updatedAt).toLocaleString('ja-JP') : '不明';

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">フレーズ詳細</h1>
                <div className="flex items-center gap-4">
                     {/* --- Star Button --- */}
                     {session && phraseData && (
                        <button
                            onClick={handleStarToggle}
                            disabled={isStarrting}
                            className={`flex items-center px-3 py-1.5 border rounded transition-colors disabled:opacity-50 ${ phraseData.userHasStarred
                                    ? 'border-yellow-500 bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                }`}
                            aria-label={phraseData.userHasStarred ? 'スターを外す' : 'スターを付ける'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${phraseData.userHasStarred ? 'text-yellow-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{phraseData.starCount ?? 0}</span>
                            {isStarrting && <span className="ml-2 text-xs">(更新中...)</span>}
                        </button>
                    )}
                    {/* ------------------- */}
                    {/* --- Fork Button (Show if logged in and not owner) --- */}
                    {session && !isOwner && (
                        <button
                            onClick={handleFork}
                            disabled={isForking}
                            className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            aria-label="このフレーズをフォークする"
                        >
                            {/* Basic Fork Icon Placeholder */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> {/* Simple folder-like icon */} 
                              {/* Better fork icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l7.5-5M15 15l6-6m-6 6v7" /> */}
                            </svg>
                            <span>{isForking ? 'フォーク中...' : 'フォーク'}</span>
                        </button>
                    )}
                    {/* -------------------------------------------------------- */}
                    {isOwner && (
                        <div className="flex gap-2">
                            <Link href={`/phrases/${phraseId}/edit`}>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    disabled={isLoading || !!loadError}
                                >
                                    編集
                                </button>
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                disabled={isDeleting || isLoading || !!loadError}
                            >
                                {isDeleting ? '削除中...' : '削除'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Display Deletion Error */}
            {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {deleteError}
                </div>
            )}

            {/* Display Star Error */}
             {starError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {starError}
                </div>
            )}

            {/* Display Fork Error */}
             {forkError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {forkError}
                </div>
            )}

            {/* Section for Score */}
            <div className="mb-8 p-4 border rounded shadow-md bg-white">
                <h2 className="text-xl font-semibold mb-4">楽譜</h2>
                <AbcNotationRenderer
                    key={phraseData.id}
                    abcNotation={phraseData.abcNotation}
                    onError={handleRenderError}
                />
                {renderError && <p className="text-red-500 mt-2">楽譜の描画エラー: {renderError.message}</p>}
            </div>

            {/* Section for Transposed Scores */}
            <div className="mb-8 p-4 border rounded shadow-md bg-white">
                <h2 className="text-xl font-semibold mb-4">全キー移調表示</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {displayKeys.map((targetKey) => {
                        const transposeAmount = getTransposeAmount(phraseData.originalKey, targetKey);
                        const renderParams = { visualTranspose: transposeAmount };
                        // Unique key for React list rendering, incorporating target key
                        const uniqueKey = `${phraseData.id}-${targetKey}`;
                        // Remove the Title (T:) line from the ABC notation for transposed versions
                        const abcNotationWithoutTitle = phraseData.abcNotation.replace(/(^|\n)T:.*\n?/g, '\n');
                        // Further modify for transposed view: remove time signature (M:)
                        const abcNotationForTransposed = abcNotationWithoutTitle
                            .replace(/(^|\n)M:.*\n?/g, '\n'); // Remove M: line

                        return (
                            <div key={uniqueKey} className="border rounded p-3 bg-gray-50">
                                <h3 className="text-lg font-medium mb-2">Key: {targetKey}</h3>
                                <AbcNotationRenderer
                                    // Using uniqueKey here as well, forces re-render if needed
                                    key={uniqueKey}
                                    abcNotation={abcNotationForTransposed} // Use modified ABC string
                                    renderParams={renderParams}
                                    engraverParams={{ responsive: 'resize' }} // Keep responsive parameter
                                    // You might want a specific error handler per transposed score or a collective one
                                    // onError={(error) => console.error(`Error rendering key ${targetKey}:`, error)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section for Metadata */}
            <div className="mb-8 p-4 border rounded shadow-md bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">情報</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="col-span-1">
                        <dt className="font-medium text-gray-600">元のキー:</dt>
                        <dd className="text-gray-800">{phraseData.originalKey}</dd>
                    </div>
                    <div className="col-span-1">
                        <dt className="font-medium text-gray-600">作成者:</dt>
                        <dd className="text-gray-800">{phraseData.user?.name || phraseData.user?.id || '不明'}</dd>
                    </div>
                    <div className="col-span-1">
                        <dt className="font-medium text-gray-600">作成日時:</dt>
                        <dd className="text-gray-800">{formattedCreatedAt}</dd>
                    </div>
                    <div className="col-span-1">
                        <dt className="font-medium text-gray-600">最終更新日時:</dt>
                        <dd className="text-gray-800">{formattedUpdatedAt}</dd>
                    </div>
                </dl>
            </div>

            {/* Section for Comment */}
            {phraseData.comment && (
                <div className="mb-8 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">コメント</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{phraseData.comment}</p>
                </div>
            )}

            {/* Section for Tags */}
            {phraseData.tags && phraseData.tags.length > 0 && (
                <div className="mb-8 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">タグ</h2>
                    <div className="flex flex-wrap gap-2">
                        {phraseData.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Section for Comments */}
            <div className="mt-8 p-4 border rounded shadow-md bg-white">
                <h2 className="text-xl font-semibold mb-4">コメント ({phraseData?.comments?.length ?? 0})</h2>

                {/* --- Comment Form (Only show if logged in) --- */}
                {session && (
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                        <label htmlFor="comment-input" className="block text-sm font-medium text-gray-700 mb-1">
                            コメントを追加
                        </label>
                        <textarea
                            id="comment-input"
                            rows={3}
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder={isOwner ? "フレーズに関するメモや練習の記録などを残せます。" : "このフレーズについてコメントを残しましょう！"}
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                            disabled={isSubmittingComment}
                        />
                        {commentError && <p className="text-red-500 text-sm mt-1">{commentError}</p>}
                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmittingComment || !newCommentContent.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmittingComment ? '送信中...' : 'コメントを投稿'}
                            </button>
                        </div>
                    </form>
                )}
                {!session && (
                     <p className="text-gray-500 text-sm mb-6">コメントするには<Link href="/login" className="text-blue-600 hover:underline">ログイン</Link>が必要です。</p>
                )}
                {/* -------------------------------------------- */}

                <div className="space-y-4 mt-4">
                    {phraseData?.comments?.length === 0 && (
                        <p className="text-gray-500">まだコメントはありません。</p>
                    )}
                    {phraseData?.comments?.map(comment => (
                        <div key={comment.id} className="p-3 border-b last:border-b-0">
                            <div className="flex items-center space-x-2 mb-1">
                                {comment.user.image ? (
                                    <img src={comment.user.image} alt={comment.user.name || 'User'} className="h-6 w-6 rounded-full" />
                                ) : (
                                    <span className="h-6 w-6 rounded-full bg-gray-300 inline-block"></span>
                                )}
                                <span className="font-medium text-sm">{comment.user.name || '匿名ユーザー'}</span>
                                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default PhraseDetailPage;
