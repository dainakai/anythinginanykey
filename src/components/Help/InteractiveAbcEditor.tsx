'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import debounce from 'lodash/debounce';

interface InteractiveAbcEditorProps {
  initialAbc: string;
}

const InteractiveAbcEditor: React.FC<InteractiveAbcEditorProps> = ({ initialAbc }) => {
  const [abcNotation, setAbcNotation] = useState(initialAbc);
  const [inputValue, setInputValue] = useState(initialAbc);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedSetAbcNotation = useCallback(
    debounce((value: string) => {
      setAbcNotation(value);
    }, 300),
    []
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    debouncedSetAbcNotation(newValue);
  };

  useEffect(() => {
    if (!previewContainerRef.current) return;

    const parentElement = previewContainerRef.current;

    const oldPreviewDiv = parentElement.querySelector('#abc-preview-inner');
    if (oldPreviewDiv) {
      parentElement.removeChild(oldPreviewDiv);
    }

    const newPreviewDiv = document.createElement('div');
    newPreviewDiv.id = 'abc-preview-inner';
    newPreviewDiv.className = "border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white overflow-auto h-[360px]";
    parentElement.appendChild(newPreviewDiv);

    try {
      if (abcNotation.trim()) {
        abcjs.renderAbc(newPreviewDiv, abcNotation, {
          responsive: 'resize',
          staffwidth: newPreviewDiv.clientWidth * 0.95,
          paddingleft: 10,
          paddingright: 10,
          paddingtop: 0,
          paddingbottom: 0,
        });
      }
    } catch (error) {
      console.error("ABC Notation rendering error:", error);
      newPreviewDiv.innerHTML = `<p class="text-red-500 p-2">記法のレンダリング中にエラーが発生しました。入力内容を確認してください。</p>`;
    }

  }, [abcNotation]);

  useEffect(() => {
    const handleResize = () => {
      const previewDiv = previewContainerRef.current?.querySelector('#abc-preview-inner') as HTMLElement | null;
      if (previewDiv && abcNotation.trim()) {
        try {
          abcjs.renderAbc(previewDiv, abcNotation, {
            responsive: 'resize',
            staffwidth: previewDiv.clientWidth * 0.95,
            paddingleft: 10,
            paddingright: 10,
            paddingtop: 0,
            paddingbottom: 0,
          });
        } catch (error) {
          console.error("ABC Notation rendering error on resize:", error);
        }
      } else if (previewDiv && !abcNotation.trim()) {
          previewDiv.innerHTML = '';
      }
    };

    const debouncedResize = debounce(handleResize, 150);

    window.addEventListener('resize', debouncedResize);
    const initialTimeout = setTimeout(() => {
      if (previewContainerRef.current) {
        handleResize();
      }
    }, 50);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      debouncedResize.cancel();
      clearTimeout(initialTimeout);
    }
  }, [abcNotation]);

  useEffect(() => {
    return () => {
      debouncedSetAbcNotation.cancel();
    };
  }, [debouncedSetAbcNotation]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>ABC Notation エディタ & プレビュー</CardTitle>
        <CardDescription>
          左側のテキストエリアにABC記法を入力または編集すると、右側に楽譜がリアルタイムで表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <label htmlFor="abc-input" className="block text-sm font-medium mb-1">ABC Notation 入力:</label>
          <Textarea
            ref={textareaRef}
            id="abc-input"
            value={inputValue}
            onChange={handleInputChange}
            rows={15}
            className="font-mono text-sm resize-none bg-gray-50 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="ここにABC Notationを入力..."
          />
        </div>
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <label htmlFor="abc-preview-container" className="block text-sm font-medium mb-1">楽譜プレビュー:</label>
          <div id="abc-preview-container" ref={previewContainerRef} aria-live="polite">
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveAbcEditor;
