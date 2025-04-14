'use client';

import React, { useState, useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface InteractiveAbcEditorProps {
  initialAbc: string;
}

const InteractiveAbcEditor: React.FC<InteractiveAbcEditorProps> = ({ initialAbc }) => {
  const [abcNotation, setAbcNotation] = useState(initialAbc);
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      abcjs.renderAbc(previewRef.current, abcNotation, {
        responsive: 'resize',
        staffwidth: previewRef.current.clientWidth * 0.95, // Adjust width slightly
        paddingleft: 10,
        paddingright: 10,
        paddingtop: 0,
        paddingbottom: 0,
      });
    }
  }, [abcNotation]);

  // Resize listener to adjust staffwidth
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        abcjs.renderAbc(previewRef.current, abcNotation, {
          responsive: 'resize',
          staffwidth: previewRef.current.clientWidth * 0.95, // Adjust width on resize
          paddingleft: 10,
          paddingright: 10,
          paddingtop: 0,
          paddingbottom: 0,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial render adjustment
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [abcNotation]); // Rerun on abcNotation change too

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbcNotation(event.target.value);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>ABC Notation エディタ & プレビュー</CardTitle>
        <CardDescription>
          左側のテキストエリアにABC記法を入力または編集すると、右側に楽譜がリアルタイムで表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        {/* Input Area - Order 2 on mobile, Order 1 on desktop */}
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <label htmlFor="abc-input" className="block text-sm font-medium mb-1">ABC Notation 入力:</label>
          <Textarea
            ref={textareaRef}
            id="abc-input"
            value={abcNotation}
            onChange={handleInputChange}
            rows={15} // Increased rows for better editing experience
            className="font-mono text-sm resize-none bg-gray-50 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="ここにABC Notationを入力..."
          />
        </div>
        {/* Preview Area - Order 1 on mobile, Order 2 on desktop */}
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <label htmlFor="abc-preview" className="block text-sm font-medium mb-1">楽譜プレビュー:</label>
          <div
            id="abc-preview"
            ref={previewRef}
            className="border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white overflow-auto h-[360px]" // Match textarea height (approx) and add scroll
            aria-live="polite"
          >
            {/* abcjs renders here */} 
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveAbcEditor;
