export const runtime = 'edge';

import React from 'react';
import faqData from '@/data/faq.json'; // JSONデータをインポート
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Accordionコンポーネントをインポート
import ReactMarkdown from 'react-markdown'; // Markdownレンダリング用
import Link from 'next/link'; // Linkコンポーネント

// Markdownレンダラーのカスタムコンポーネント (リンク用)
const CustomLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
  if (href && href.startsWith('/')) {
    // 内部リンクの場合
    return <Link href={href} className="text-indigo-600 hover:text-indigo-800 underline">{children}</Link>;
  } else if (href) {
    // 外部リンクの場合
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">{children}</a>;
  }
  // hrefがない場合は通常のテキストとしてレンダリング
  return <>{children}</>;
};


export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">よくある質問 (FAQ)</h1>

      {faqData && faqData.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item) => (
            <AccordionItem value={item.id} key={item.id} className="border-b border-gray-200 dark:border-gray-700">
              <AccordionTrigger className="py-4 text-lg font-semibold text-left hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md px-2">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2 px-2 text-gray-700 dark:text-gray-300">
                 {/* Use ReactMarkdown to render the answer */}
                <ReactMarkdown
                  components={{
                    a: CustomLink, // Use custom component for links
                     p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>, // Add margin to paragraphs
                     ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                     ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                     code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">{children}</code>,
                  }}
                >
                    {item.answer}
                </ReactMarkdown>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-center text-gray-500">現在、よくある質問はありません。</p>
      )}
    </div>
  );
}
