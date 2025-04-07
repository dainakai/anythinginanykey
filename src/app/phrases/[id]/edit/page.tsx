'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import hooks for route params and navigation
import { parseAbcNotation, AbcHeader } from '@/lib/abcParser';
import dynamic from 'next/dynamic';

// Dynamically import the renderer component, disabling SSR
const AbcNotationRenderer = dynamic(() => import('@/components/AbcNotationRenderer'), {
  ssr: false,
  loading: () => <p>Loading renderer...</p> // Optional loading indicator
});

// Define type for the fetched phrase data (adjust based on actual API response)
interface PhraseData {
    id: string;
    abcNotation: string;
    comment: string | null;
    tags: { name: string }[]; // Assuming API returns tags like this
    // Add other relevant fields if needed
}

const EditPhrasePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const phraseId = params?.id as string; // Get phrase ID from route

  // State for form fields
  const [abcInput, setAbcInput] = useState<string>(''); // Initialize empty
  const [comment, setComment] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');

  // State for validation and submission
  const [parsedHeader, setParsedHeader] = useState<AbcHeader | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // State for loading phrase data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  // --- Fetch existing phrase data --- (Runs once on mount)
  useEffect(() => {
    if (!phraseId) {
      setLoadError('Invalid Phrase ID.');
      setIsLoading(false);
      return;
    }

    const fetchPhrase = async () => {
      setIsLoading(true);
      setLoadError('');
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

        // Set form state with fetched data
        setAbcInput(data.abcNotation || '');
        setComment(data.comment || '');
        setTagsInput(data.tags?.map(tag => tag.name).join(', ') || ''); // Join tag names for input

      } catch (error) {
        console.error('Error fetching phrase:', error);
        setLoadError(`データの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhrase();
  }, [phraseId]);

  // Parses header, does not validate syntax deeply
  const handleValidation = useCallback(() => {
    setParseError(''); // Reset parse error initially
    setParsedHeader(null);
    setRenderError(null); // Also reset render error, it will be set by the renderer

    if (!abcInput.trim()) {
        // If input is empty or only whitespace, clear header and return
        setParsedHeader(null);
        return;
    }

    try {
      const result = parseAbcNotation(abcInput);
      if (result) {
        setParsedHeader(result.header);
      } else {
        // This case might be less likely now, but keep for unexpected issues
        setParseError('Failed to process ABC notation.');
      }
    } catch (error) {
      // Catch internal errors during basic parsing
      console.error('Internal parsing error:', error);
      setParseError(`An internal error occurred during parsing: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [abcInput]);

  useEffect(() => {
    handleValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleValidation]);

  // Memoize handleRenderError to prevent infinite loops
  const handleRenderError = useCallback((error: Error | null) => {
    // Optimize state updates: only update if the value actually changes
    setRenderError(currentError => {
      // Basic comparison for Error objects (might need refinement if error identity changes)
      if (currentError?.message === error?.message) return currentError;
      return error;
    });
    if (error) {
      setParseError(''); // Clear internal parse error if render error occurs
    }
  }, []);

  // Validity now primarily depends on the renderError and submission status
  const isValidForSubmission = !renderError && !isSubmitting && !isLoading && !loadError;

  const handleUpdate = async () => {
    if (!isValidForSubmission || !phraseId) {
      console.error("Validation failed, already submitting, or missing ID. Cannot update.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const response = await fetch(`/api/phrases/${phraseId}`, { // Use PUT and include ID
        method: 'PUT', // Use PUT method
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abcNotation: abcInput, comment, tags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const updatedPhrase = await response.json();
      console.log('Phrase updated successfully:', updatedPhrase);
      alert(`フレーズが更新されました！`);
      // Optionally redirect after update
      // router.push(`/phrases/${phraseId}`); // Redirect to detail page (if exists)
      router.back(); // Or simply go back

    } catch (error) {
      console.error('Error updating phrase:', error);
      setSubmitError(`更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  if (loadError) {
    return <div className="container mx-auto p-4 text-red-500">エラー: {loadError}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">フレーズの編集</h1>

      {/* Use handleUpdate for form submission */}
      <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
        {/* Form fields are mostly the same, just populated with initial data */}
        <div className="mb-6">
          <label htmlFor="abcInput" className="block text-xl font-semibold mb-2">ABC Notation:</label>
          <textarea
            id="abcInput"
            className="w-full h-60 p-2 border rounded font-mono text-sm"
            value={abcInput}
            onChange={(e) => setAbcInput(e.target.value)}
            placeholder="X:1\nT:Title\nM:4/4\nL:1/8\nK:C\nCDEF|GABc|"
            required
            disabled={isLoading} // Disable while loading initial data
          />
        </div>

        <div className="mb-6">
          <label htmlFor="comment" className="block text-xl font-semibold mb-2">コメント:</label>
          <textarea
            id="comment"
            className="w-full h-20 p-2 border rounded text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="フレーズの説明や使い方のメモなど"
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="tagsInput" className="block text-xl font-semibold mb-2">タグ (カンマ区切り):</label>
          <input
            type="text"
            id="tagsInput"
            className="w-full p-2 border rounded text-sm"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例: Major 2-5-1, Bebop Scale, Lick"
            disabled={isLoading}
          />
        </div>

        {(parseError || renderError || submitError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
            {/* Display internal parse error only if no render error exists */}
            {parseError && !renderError && <p><strong>内部パースエラー:</strong> {parseError}</p>}
            {renderError && <p><strong>楽譜レンダリングエラー:</strong> {renderError.message}</p>}
            {submitError && <p><strong>更新エラー:</strong> {submitError}</p>}
          </div>
        )}

        {/* Display parsed header only if no render error and header exists */}
        {!renderError && parsedHeader && (
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Parsed Header Information:</h2>
            <pre className="text-sm">{JSON.stringify(parsedHeader, null, 2)}</pre>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-2">Preview:</h2>
          <div className="p-4 border rounded min-h-[100px]">
            {/* Pass the handleRenderError callback */}
            <AbcNotationRenderer abcNotation={abcInput} onError={handleRenderError} />
          </div>
        </div>

        {/* Update Button */}
        <div className="mt-6">
          <button
            type="submit"
            className={`px-4 py-2 rounded ${isValidForSubmission ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={!isValidForSubmission}
          >
            {isSubmitting ? '更新中...' : '更新'}
          </button>
           <button
                type="button"
                onClick={() => router.back()} // Go back without saving
                className="ml-4 px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={isSubmitting}
            >
                キャンセル
            </button>
        </div>
      </form>

    </div>
  );
};

export default EditPhrasePage;


