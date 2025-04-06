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
}

const AbcNotationRenderer: React.FC<AbcNotationRendererProps> = ({
  abcNotation,
  parserParams = {},
  engraverParams = {},
  renderParams = {},
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

        try {
          // Combine params into a single options object
          const options = {
            ...parserParams,
            ...engraverParams,
            ...renderParams,
          };

          // Use the global ABCJS object
          ABCJS.renderAbc(
            notationRef.current,
            abcNotation,
            options
          );
        } catch (error) {
          console.error('Error rendering ABC notation:', error);
          notationRef.current.innerHTML = '<p class="text-red-500">楽譜のレンダリング中にエラーが発生しました。</p>';
        }
      } else if (notationRef.current) {
        notationRef.current.innerHTML = '';
      }
    }
  // Depend on isScriptLoaded and other relevant props
  }, [isScriptLoaded, abcNotation, parserParams, engraverParams, renderParams]);

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
