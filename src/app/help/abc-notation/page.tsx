'use client'; // Required for useState in InteractiveAbcEditor

import React from 'react';
import InteractiveAbcEditor from '@/components/Help/InteractiveAbcEditor';
// We might still want the markdown guide for detailed explanations
// import AbcNotationGuide from '@/components/Help/AbcNotationGuide';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABC Notation ガイド - Anything in Anykeys',
  description: 'Anything in Anykeys で使用する ABC Notation の入力方法についてのガイドです。',
};

export default function AbcNotationHelpPage() {
  // Example ABC notation string
  const exampleAbc = `X:1\nT:Example Tune\nM:4/4\nL:1/8\nK:C\nCDEF GABc | cBAG FEDC |\nw:Lyrics line 1\nw:Lyrics line 2\n"G7" G,2B,D G2Bd | "C" c2ge c'2a^f |]`;

  const exampleForUser = `K:A\n"E7" =g2 (3 =f=cG =G2 =FE- | "Amaj7" E2 |]`;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ABC Notation ヘルプ & エディタ</h1>

      {/* Interactive Editor Section */}
      <InteractiveAbcEditor initialAbc={exampleForUser} />

      {/* Static Guide Section (Optional: Keep or remove based on preference) */}
      {/* If keeping the markdown guide, uncomment the import and this section */}
      {/*
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">ABC Notation 基本ガイド</h2>
        <AbcNotationGuide />
      </div>
      */}

      {/* Add more explanatory text, links to resources, etc. here */}
      <div className="mt-8 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">さらに詳しく</h3>
        <p>ABC Notationにはさらに多くの機能があります（装飾音、繰り返し記号、歌詞など）。</p>
        <p className="mt-2">
          より詳細な情報は、公式のドキュメントや他のリソースを参照してください。
          （ここに外部リンクなどを追加できます）
        </p>
        <p className="mt-2">
          例として、少し複雑な記法も試せます：
        </p>
        <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto dark:bg-gray-900 dark:text-gray-300">
          <code>{exampleAbc}</code>
        </pre>
         <p className="mt-2">
            上記のテキストをコピーして、上のエディタに貼り付けてみてください。
         </p>

      </div>
    </main>
  );
}
