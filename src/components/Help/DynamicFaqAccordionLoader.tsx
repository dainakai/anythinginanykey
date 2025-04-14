"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// FAQデータの型定義 (FaqAccordionに合わせる)
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface LoaderProps {
  faqData: FaqItem[];
}

// FaqAccordionを動的にインポートし、SSRを無効にする
const FaqAccordion = dynamic(() => import('@/components/Help/FaqAccordion'), {
  ssr: false,
  // loading: () => <p>Loading...</p>, // 必要であればローディング表示を追加
});

// このコンポーネントが動的インポートを行う
export default function DynamicFaqAccordionLoader({ faqData }: LoaderProps) {
  return <FaqAccordion faqData={faqData} />;
} 