'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AbcNotationRenderer from '@/components/AbcNotationRenderer';
import { Tag } from '@prisma/client';

export default function EditPhrasePage() {
  const router = useRouter();
  const params = useParams();
  const phraseId = params.phraseId as string;

  const [abcNotation, setAbcNotation] = useState('');
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated tags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Fetch available tags for datalist suggestions
  const fetchAvailableTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data: Tag[] = await response.json();
      setAvailableTags(data);
    } catch (err) {
      console.error('Error fetching available tags:', err);
    }
  }, []);

  // Fetch existing phrase data
  const fetchPhraseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/phrases/${phraseId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Phrase not found');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAbcNotation(data.abcNotation);
      setComment(data.comment || '');
      setTags(data.tags.map((tag: Tag) => tag.name).join(', ')); // Convert tags array to comma-separated string
    } catch (err: unknown) {
      console.error('Failed to fetch phrase data:', err);
      const errorMessage = err instanceof Error ? err.message : (err ? String(err) : 'Unknown error');
      setError(`フレーズデータの読み込みに失敗しました: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [phraseId]);

  useEffect(() => {
    if (phraseId) {
      fetchPhraseData();
      fetchAvailableTags();
    }
  }, [phraseId, fetchPhraseData, fetchAvailableTags]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate using previewError state from AbcNotationRenderer
    if (previewError) {
        setError(`ABC Notation preview has an error: ${previewError}. Please correct it before saving.`);
        setIsSubmitting(false);
        return;
    }
    // Also check if abcNotation is empty, although required attribute helps
    if (!abcNotation.trim()) {
        setError('ABC Notation cannot be empty.');
        setIsSubmitting(false);
        return;
    }

    try {
      // Split the comma-separated tags string into an array of non-empty strings
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const response = await fetch(`/api/phrases/${phraseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the tagArray instead of the tags string
        body: JSON.stringify({ abcNotation, comment, tags: tagArray }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Redirect to the phrase detail page or dashboard after update
      router.push(`/phrases/${phraseId}`);
      // router.push('/dashboard');

    } catch (err: unknown) {
      console.error('Failed to update phrase:', err);
      const errorMessage = err instanceof Error ? err.message : (err ? String(err) : 'Unknown error');
      setError(`フレーズの更新に失敗しました: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>;
  }

  if (error && error.includes('Phrase not found')) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <h1 className="text-2xl font-bold mb-4">エラー</h1>
              <p className="text-red-600 mb-4">指定されたフレーズが見つかりませんでした。</p>
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                  ダッシュボードに戻る
              </Link>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">フレーズを編集</h1>
      {error && !error.includes('Phrase not found') && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">エラー: {error}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Editor and Metadata */}
        <div className="space-y-4">
          <div>
            <label htmlFor="abcNotation" className="block text-sm font-medium text-gray-700 mb-1">
              ABC Notation
            </label>
            <textarea
              id="abcNotation"
              rows={15}
              value={abcNotation}
              onChange={(e) => setAbcNotation(e.target.value)}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 font-mono"
            />
            {previewError && <p className="text-xs text-red-600 mt-1">{previewError}</p>}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              コメント (任意)
            </label>
            <input
              type="text"
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              タグ (カンマ区切り, 任意)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              list="available-tags-datalist" // Link input to datalist
            />
            {/* Datalist for tag suggestions */}
            <datalist id="available-tags-datalist">
                {availableTags.map(tag => (
                    <option key={tag.id} value={tag.name} />
                ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">既存のタグ名を入力し始めると候補が表示されます。新しいタグも自由に追加できます。</p>
          </div>

           <div className="flex justify-end gap-3 mt-4">
             <button
                type="button"
                onClick={() => router.back()} // Go back to previous page (likely phrase detail)
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!previewError}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '更新中...' : '変更を保存'}
              </button>
           </div>
        </div>

        {/* Right Column: Real-time Preview */}
        <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">プレビュー</h2>
            <div className="p-4 border rounded-md bg-white min-h-[200px]">
                {!previewError && abcNotation ? (
                    <AbcNotationRenderer
                        key={abcNotation} // Re-render when abcNotation changes
                        abcNotation={abcNotation}
                        renderParams={{ responsive: 'resize' }}
                        onError={(err) => {
                             // Check if err is not null before accessing message
                            setPreviewError(err ? `プレビューエラー: ${err.message}` : null);
                        }}
                    />
                ) : (
                    <p className="text-gray-500 italic">{previewError || "ABC Notation を入力してください"}</p>
                )}
            </div>
        </div>
      </form>
    </div>
  );
}
