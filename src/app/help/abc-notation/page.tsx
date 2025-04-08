import React from 'react';
import InteractiveAbcEditor from '@/components/Help/InteractiveAbcEditor';
// We might still want the markdown guide for detailed explanations
// import AbcNotationGuide from '@/components/Help/AbcNotationGuide';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABC Notation ガイド - Anything in AnyKey',
  description: 'Anything in AnyKey で使用する ABC Notation の入力方法についてのガイドです。',
};

export default function AbcNotationHelpPage() {
  // Example ABC notation string
  const exampleAbc = `X:1\nT:Example Tune\nM:4/4\nL:1/8\nK:C\nCDEF GABc | cBAG FEDC |\nw:Lyrics line 1\nw:Lyrics line 2\n"G7" G,2B,D G2Bd | "C" c2ge c'2a^f |]`;

  const exampleForUser = `T:Cry me a river lick\nL:1/8\nK:A\n"E7" =g2 (3 =f=cG =G2 =FE- | "Amaj7" E2 |]`;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ABC Notation ヘルプ & エディタ</h1>

      {/* Interactive Editor Section */}
      <InteractiveAbcEditor initialAbc={exampleForUser} />

      {/* Explanation of the example */}
      <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">エディタの例 解説</h3>
        <p>現在エディタに表示されているのは &quot;Cry Me a River&quot; のリック（短いフレーズ）の例です。</p>
        <pre className="bg-gray-100 p-3 rounded my-2 text-sm overflow-x-auto dark:bg-gray-900 dark:text-gray-300">
            <code>{exampleForUser}</code>
        </pre>
        <ul className="list-disc list-inside space-y-1 text-sm">
            <li><code>T:Cry me a river lick</code>: 曲のタイトルを指定します。</li>
            <li><code>L:1/8</code>: 基本となる音符の長さを八分音符 (1/8) に設定します。</li>
            <li><code>K:A</code>: 曲の調号をイ長調 (A Major) に設定します。シャープが3つ付きます。</li>
            <li><code>&quot;E7&quot;</code> と <code>&quot;Amaj7&quot;</code>: コードネームです。音符の上に表示されます。</li>
            <li><code>=g2</code>: Gナチュラル（♮G）の音符を四分音符（基本の1/8の2倍）の長さで演奏します。<code>=</code> はナチュラル記号です。</li>
            <li><code>(3 =f=cG</code>: Fナチュラル、C、Gの3つの音符を八分音符3つ分の長さで演奏する三連符です。<code>(3</code> が三連符の開始を示します。</li>
            <li><code>=G2</code>: Gナチュラルの音符を四分音符の長さで。</li>
            <li><code>=FE-</code>: Fナチュラル、Eの音符をそれぞれ八分音符で演奏し、最後のEにタイ (<code>-</code>) が付いています。次の小節の音符に繋がります。</li>
            <li><code>|</code>: 小節線です。</li>
            <li><code>E2</code>: Eの音符を四分音符の長さで。前の小節のタイと繋がり、合計の長さになります。</li>
            <li><code>|]</code>: 曲の終わりを示す複縦線です。</li>
        </ul>
        <p className="mt-3">このように、ABC記法ではテキストで楽譜の要素を表現します。エディタで色々変更して、プレビューの変化を試してみてください。</p>
      </div>

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
        <h3 className="text-lg font-semibold mb-2">その他の記法</h3>
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
