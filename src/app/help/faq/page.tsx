export const runtime = 'edge';

import React from 'react';
import faqData from '@/data/faq.json'; // JSONデータをインポート
// import dynamic from 'next/dynamic'; // 不要になる
import DynamicFaqAccordionLoader from '@/components/Help/DynamicFaqAccordionLoader'; // 新しいローダーをインポート

// FaqAccordionを動的にインポートする部分は削除
// const FaqAccordion = dynamic(() => import('@/components/Help/FaqAccordion'), {
//   ssr: false,
//   // ローディング中の表示 (任意)
//   // loading: () => <p>Loading...</p>,
// });

export default function FaqPage() {
  // faqDataを型アサーション (必要に応じて)
  const typedFaqData = faqData as { id: string; question: string; answer: string; }[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">よくある質問 (FAQ)</h1>

      {typedFaqData && typedFaqData.length > 0 ? (
        // <FaqAccordion faqData={typedFaqData} /> // 以前の呼び出しを削除
        <DynamicFaqAccordionLoader faqData={typedFaqData} /> // 新しいローダーを使用
      ) : (
        <p className="text-center text-gray-500">現在、よくある質問はありません。</p>
      )}
    </div>
  );
}
