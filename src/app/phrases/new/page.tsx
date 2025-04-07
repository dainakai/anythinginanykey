'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AbcNotationRenderer from '@/components/AbcNotationRenderer';
import { Tag } from '@prisma/client';

export default function NewPhrasePage() {
  const router = useRouter();
  const [abcNotation, setAbcNotation] = useState('X:1\nT:New Phrase\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |');
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated tags
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      // Handle error appropriately, maybe show a message
    }
  }, []);

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

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

      const response = await fetch('/api/phrases', {
        method: 'POST',
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

      const newPhrase = await response.json();
      // Redirect to the dashboard or the new phrase detail page
      router.push('/dashboard'); // Redirect to dashboard for now
      // router.push(`/phrases/${newPhrase.id}`);

    } catch (err: unknown) {
      console.error('Failed to create phrase:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`フレーズの作成に失敗しました: ${errorMessage}`);
      setIsSubmitting(false);
    }
    // No finally block to reset isSubmitting, because we redirect on success
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">新しいフレーズを作成</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">エラー: {error}</p>}
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
              placeholder="X:1\nT:タイトル\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |"
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
              placeholder="例: II-V-I フレーズ、マイナーブルースで使用"
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
              placeholder="例: Major 2-5-1, Bebop, C Major"
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
                onClick={() => router.push('/dashboard')}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!previewError} // Disable if preview has errors
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '保存中...' : 'フレーズを保存'}
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
