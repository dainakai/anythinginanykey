'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const AbcNotationGuide: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    // Assuming the guide file is placed in the public directory for direct access
    // Adjust the path if it's served differently
    fetch('/docs/abc_notation_guide.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load guide');
        }
        return response.text();
      })
      .then((text) => {
        setMarkdownContent(text);
      })
      .catch((error) => {
        console.error('Error loading ABC Notation guide:', error);
        setMarkdownContent('ガイドの読み込みに失敗しました。');
      });
  }, []);

  return (
    <div className="prose dark:prose-invert max-w-none p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};

export default AbcNotationGuide;
