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
  // const [isScriptLoaded, setIsScriptLoaded] = React.useState(false); // REMOVED isScriptLoaded state

  useEffect(() => {
    let animationFrameId: number | null = null;
    let checkIntervalId: NodeJS.Timeout | null = null; // Use interval/timeout for checking
    let attempts = 0;
    const maxAttempts = 50; // Limit attempts to avoid infinite loop (50 * 100ms = 5 seconds)

    const renderAbcNotation = () => {
      console.log('[AbcRenderer] Attempting to render...');
      if (notationRef.current && abcNotation) {
        const currentRef = notationRef.current;
        currentRef.innerHTML = ''; // Clear previous notation

        animationFrameId = requestAnimationFrame(() => {
          console.log('[AbcRenderer] Rendering in animation frame...');
          try {
            const ABCJS = window.ABCJS; // Re-check just before using
            if (!ABCJS) {
              throw new Error('window.ABCJS not available at render time.');
            }
            const options = {
              ...parserParams,
              ...engraverParams,
              ...renderParams,
            };
            const visualObj = ABCJS.renderAbc(currentRef, abcNotation, options);

            if (visualObj && visualObj.length > 0 && visualObj[0].warnings) {
              console.warn('[AbcRenderer] ABCJS warnings:', visualObj[0].warnings);
              const error = new Error(`ABC Notation Warning/Error: ${visualObj[0].warnings.join(', ')}`);
              if (onError) onError(error);
            } else {
              console.log('[AbcRenderer] ABC rendering successful.');
              if (onError) onError(null);
            }
          } catch (error) {
            console.error('[AbcRenderer] ABC rendering failed:', error);
            if (currentRef) {
              currentRef.innerHTML = '<p class="text-red-500">楽譜のレンダリング中にエラーが発生しました。</p>';
            }
            if (onError) onError(error instanceof Error ? error : new Error(String(error)));
          }
        });
      } else if (notationRef.current) {
        // Clear notation if abcNotation is empty
        notationRef.current.innerHTML = '';
        console.log('[AbcRenderer] Clearing notation (empty abcNotation).');
        if (onError) onError(null);
      }
    };

    // Function to check if ABCJS is ready
    const checkABCJS = () => {
      console.log(`[AbcRenderer] Checking for window.ABCJS (Attempt ${attempts + 1})...`);
      if (typeof window !== 'undefined' && window.ABCJS) {
        console.log('[AbcRenderer] window.ABCJS found!');
        if (checkIntervalId) clearInterval(checkIntervalId); // Stop checking
        renderAbcNotation(); // Render now that it's ready
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('[AbcRenderer] window.ABCJS not found after maximum attempts.');
          if (checkIntervalId) clearInterval(checkIntervalId);
          // Update UI and call onError on timeout
          if (notationRef.current) {
              notationRef.current.innerHTML = '<p class="text-red-500">楽譜の読み込みに失敗しました。ページをリロードしてみてください。</p>';
          }
          if (onError) onError(new Error('ABCJS library failed to load or initialize after timeout.'));
        }
        // Continue checking via the interval (if not timed out)
      }
    };

    // Start checking for ABCJS periodically
    if (typeof window !== 'undefined') { // Only run interval in browser
        checkIntervalId = setInterval(checkABCJS, 100); // Check every 100ms
        checkABCJS(); // Initial immediate check
    }

    // Cleanup function
    return () => {
      console.log('[AbcRenderer] Cleanup effect.');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log('[AbcRenderer] Cancelled animation frame:', animationFrameId);
      }
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        console.log('[AbcRenderer] Cleared check interval.');
      }
    };
    // Depend only on props that should trigger a re-render attempt
  }, [abcNotation, parserParams, engraverParams, renderParams, onError]);

  return (
    <>
      {/* Load abcjs script via next/script */}
      <Script
        id="abcjs-script" // Add an ID for potential reference
        src="/scripts/abcjs-basic.js" // Path relative to the public directory
        strategy="afterInteractive"  // Keep this strategy
        onLoad={() => {
          // We no longer use isScriptLoaded state, but logging is still useful
          console.log('abcjs script finished loading.');
          // The check interval in useEffect will handle finding window.ABCJS
        }}
        onError={(e) => {
          console.error('Error loading abcjs script:', e);
          // Consider calling onError here as well if script fails to load
          if (onError) onError(new Error(`Failed to load abcjs script: ${e.message}`));
        }}
      />
      <div ref={notationRef} />
    </>
  );
};

export default AbcNotationRenderer;
