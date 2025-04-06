'use client';

import React, { useState, useEffect } from 'react';
// import AbcNotationRenderer from '@/components/AbcNotationRenderer'; // Direct import removed
import { parseAbcNotation, AbcHeader } from '@/lib/abcParser';
import dynamic from 'next/dynamic';

// Dynamically import the renderer component, disabling SSR
const AbcNotationRenderer = dynamic(() => import('@/components/AbcNotationRenderer'), {
  ssr: false,
  loading: () => <p>Loading renderer...</p> // Optional loading indicator
});

const TestAbcPage: React.FC = () => {
  const initialAbc = `
X:1
T: Cooley's
M: 4/4
L: 1/8
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|`;

  const [abcInput, setAbcInput] = useState<string>(initialAbc);
  const [parsedHeader, setParsedHeader] = useState<AbcHeader | null>(null);
  const [parseError, setParseError] = useState<string>('');

  const handleParse = () => { // Changed back to sync
    setParseError('');
    setParsedHeader(null);
    try {
      // Call the sync parser function directly
      const result = parseAbcNotation(abcInput);
      if (result) {
        setParsedHeader(result.header);
      } else {
        setParseError('Failed to parse ABC notation. Input might be empty or invalid.');
      }
    } catch (error) {
      console.error('Parsing error:', error);
      setParseError(`An error occurred during parsing: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Initial parse on component mount
  useEffect(() => {
    handleParse(); // Call the sync handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abcInput]); // Depend on abcInput so it re-parses when input changes

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ABC Notation Test Page</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Input ABC Notation:</h2>
        <textarea
          className="w-full h-40 p-2 border rounded font-mono text-sm"
          value={abcInput}
          onChange={(e) => setAbcInput(e.target.value)}
          placeholder="Enter ABC Notation here..."
        />
        <button
          onClick={handleParse}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Parse and Render
        </button>
      </div>

      {parseError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
          <p><strong>Parsing Error:</strong> {parseError}</p>
        </div>
      )}

      {parsedHeader && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Parsed Header Information:</h2>
          <pre className="text-sm">{JSON.stringify(parsedHeader, null, 2)}</pre>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">Rendered Notation:</h2>
        <div className="p-4 border rounded">
          <AbcNotationRenderer abcNotation={abcInput} />
        </div>
      </div>
    </div>
  );
};

export default TestAbcPage;
