'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import AbcNotationRenderer from '@/components/AbcNotationRenderer'; // Direct import removed
import { parseAbcNotation, AbcHeader } from '@/lib/abcParser';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamically import the renderer component, disabling SSR
const AbcNotationRenderer = dynamic(() => import('@/components/AbcNotationRenderer'), {
  ssr: false,
  loading: () => <p>Loading renderer...</p> // Optional loading indicator
});

const NewPhrasePage: React.FC = () => {
  const router = useRouter();
  const initialAbc = `
X:1
T: New Phrase Title
M: 4/4
L: 1/8
K: C
C D E F | G A B c |
c B A G | F E D C |`;

  const [abcInput, setAbcInput] = useState<string>(initialAbc);
  const [parsedHeader, setParsedHeader] = useState<AbcHeader | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [renderError, setRenderError] = useState<Error | null>(null); // State for rendering error
  const [comment, setComment] = useState<string>(''); // State for comment
  const [tagsInput, setTagsInput] = useState<string>(''); // State for tags input string
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State for submission status
  const [submitError, setSubmitError] = useState<string>(''); // State for submission error

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
  const isValidForSubmission = !renderError && !isSubmitting;

  const handleRegister = async () => {
    // Use the new validity check for submission
    if (!isValidForSubmission) {
      console.error("Rendering error or already submitting. Cannot register.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    // Simple tag parsing (split by comma, trim whitespace)
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const response = await fetch('/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abcNotation: abcInput, comment, tags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const savedPhrase = await response.json();
      console.log('Phrase registered successfully:', savedPhrase);
      alert(`フレーズが登録されました！\nID: ${savedPhrase.id}`);
      // TODO: Redirect to the phrase list page or the new phrase page
      // router.push('/phrases');
      // Reset form ?
      // setAbcInput('');
      // setComment('');
      // setTagsInput('');
    } catch (error) {
      console.error('Error registering phrase:', error);
      setSubmitError(`登録中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to the dashboard page
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">フレーズの新規登録</h1>

      <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}> {/* Add form tag */}
        <div className="mb-6">
          <label htmlFor="abcInput" className="block text-xl font-semibold mb-2">ABC Notation:</label>
          <textarea
            id="abcInput"
            className="w-full h-60 p-2 border rounded font-mono text-sm"
            value={abcInput}
            onChange={(e) => setAbcInput(e.target.value)}
            placeholder="X:1\nT:Title\nM:4/4\nL:1/8\nK:C\nCDEF|GABc|"
            required // Add basic required validation
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
          />
        </div>

        {(parseError || renderError || submitError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
            {/* Display internal parse error only if no render error exists */}
            {parseError && !renderError && <p><strong>内部パースエラー:</strong> {parseError}</p>}
            {renderError && <p><strong>楽譜レンダリングエラー:</strong> {renderError.message}</p>}
            {submitError && <p><strong>登録エラー:</strong> {submitError}</p>}
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

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded ${isValidForSubmission ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={!isValidForSubmission}
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>
      </form> {/* Close form tag */}

    </div>
  );
};

export default NewPhrasePage;


