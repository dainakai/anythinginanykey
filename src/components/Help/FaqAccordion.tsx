"use client";

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQデータの型定義
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqData: FaqItem[];
}

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

export default function FaqAccordion({ faqData }: FaqAccordionProps) {
  return (
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
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
              }}
            >
                {item.answer}
            </ReactMarkdown>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
} 