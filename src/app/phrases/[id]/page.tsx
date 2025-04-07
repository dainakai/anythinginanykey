'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import dynamic from 'next/dynamic';
import Link from 'next/link'; // Import Link for navigation

// Dynamically import the renderer component, disabling SSR
const AbcNotationRenderer = dynamic(() => import('@/components/AbcNotationRenderer'), {
    ssr: false,
    loading: () => <p>Loading renderer...</p> // Optional loading indicator
});

// Define type for the fetched phrase data (adjust based on actual API response)
interface PhraseData {
    id: string;
    abcNotation: string;
    originalKey: string;
    comment: string | null;
    createdAt: string; // Assuming createdAt is a string for simplicity
    updatedAt: string; // Assuming updatedAt is a string for simplicity
    user: {
        id: string;
        name: string | null;
    } | null; // User might be null if not properly populated
    tags: { name: string }[]; // Assuming API returns tags like this
    // Add other relevant fields like starCount, isPublic, etc. based on your model
}

const PhraseDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter(); // Initialize useRouter
    const phraseId = params?.id as string; // Get phrase ID from route

    const [phraseData, setPhraseData] = useState<PhraseData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string>('');
    const [renderError, setRenderError] = useState<Error | null>(null); // State for rendering error
    const [isDeleting, setIsDeleting] = useState<boolean>(false); // State for deletion status
    const [deleteError, setDeleteError] = useState<string>(''); // State for deletion error

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
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Link href={`/phrases/${phraseId}/edit`}>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            disabled={isLoading || !!loadError} // Disable if loading or error
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
            </div>

            {/* Display Deletion Error */}
            {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {deleteError}
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

        </div>
    );
};

export default PhraseDetailPage;
