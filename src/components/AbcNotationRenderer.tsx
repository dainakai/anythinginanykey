'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
// import abcjs from 'abcjs'; // Direct import removed
// import type { TuneObjectParams, EngraverParams, RenderParams } from 'abcjs'; // Import types only - Removed specific TuneObjectParams
// import type { EngraverParams, RenderParams } from 'abcjs'; // Import other types - Removed

interface AbcNotationRendererProps {
  abcNotation: string;
  // parserParams?: TuneObjectParams; // Use imported type - Changed to object
  parserParams?: object; // Use generic object type for parserParams
  // engraverParams?: EngraverParams; // Use imported type - Changed to object
  engraverParams?: object; // Use generic object type for engraverParams
  // renderParams?: RenderParams;     // Use imported type - Changed to object
  renderParams?: object; // Use generic object type for renderParams
  onError?: (error: Error | null) => void; // Add onError callback prop
}

const AbcNotationRenderer: React.FC<AbcNotationRendererProps> = ({
  abcNotation,
  parserParams = {},
  engraverParams = {},
  renderParams = {},
  onError, // Destructure onError prop
}) => {
  const notationRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);

  useEffect(() => {
    // Check if script is loaded and window.ABCJS is available
    // Rely on the global type declaration in types/globals.d.ts
    if (isScriptLoaded && typeof window !== 'undefined' && window.ABCJS) {
      const ABCJS = window.ABCJS; // Access directly
      if (notationRef.current && abcNotation) {
        // Clear previous notation
        notationRef.current.innerHTML = '';
        console.log('[AbcRenderer] Attempting to render ABC:', abcNotation.substring(0, 100) + '...'); // DEBUG LOG

        try {
          // Combine params into a single options object
          const options = {
            ...parserParams,
            ...engraverParams,
            ...renderParams,
          };

          // Use the global ABCJS object
          const visualObj = ABCJS.renderAbc( // Assign result to check for warnings/errors
            notationRef.current,
            abcNotation,
            options
          );

          // Check for warnings in the returned object (abcjs might put errors here)
          if (visualObj && visualObj.length > 0 && visualObj[0].warnings) {
              console.warn('[AbcRenderer] ABCJS warnings:', visualObj[0].warnings); // DEBUG LOG
              // Treat warnings as errors for validation purposes
              const error = new Error(`ABC Notation Warning/Error: ${visualObj[0].warnings.join(', ')}`);
              if (onError) {
                  onError(error);
              }
              // Optional: Display warning in the UI as well
              // notationRef.current.innerHTML = `<p class=\"text-orange-500\">楽譜のレンダリング中に警告が発生しました: ${visualObj[0].warnings.join(\', \')}</p>`;
          } else {
              console.log('[AbcRenderer] ABC rendering successful (no warnings).'); // DEBUG LOG
              // If rendering is successful, notify with null error
              if (onError) {
                  onError(null);
              }
          }
        } catch (error) {
          console.error('[AbcRenderer] ABC rendering failed! Error caught:', error); // DEBUG LOG
          notationRef.current.innerHTML = '<p class="text-red-500">楽譜のレンダリング中にエラーが発生しました。</p>';
          // If rendering fails, notify with the error object
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      } else if (notationRef.current) {
        notationRef.current.innerHTML = '';
        console.log('[AbcRenderer] Clearing notation (no abcInput).'); // DEBUG LOG
        // Also notify that there's no error when input is cleared
        if (onError) {
            onError(null);
        }
      }
    }
  // Depend on isScriptLoaded and other relevant props, including onError
  }, [isScriptLoaded, abcNotation, parserParams, engraverParams, renderParams, onError]); // Add onError to dependency array

  return (
    <>
      {/* Load abcjs script via next/script */}
      <Script
        src="/scripts/abcjs-basic.js" // Path relative to the public directory
        strategy="lazyOnload"        // Load after the page is interactive
        onLoad={() => {
          console.log('abcjs script loaded.');
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('Error loading abcjs script:', e);
        }}
      />
      <div ref={notationRef} />
    </>
  );
};

export default AbcNotationRenderer;
