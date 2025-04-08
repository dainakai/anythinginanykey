'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Remove CardDescription import
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, BookOpen, PlusCircle } from 'lucide-react'; // Import icons

const TutorialPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl"> {/* Limit width for better readability */}
      <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center">
        <Music className="w-8 h-8 mr-3 text-blue-500" /> {/* Add icon */}
        ようこそ Anything in Anykeys へ！
      </h1>

      {/* What is this App? Section */}
      <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300"> {/* Add shadow */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">このアプリでできること</CardTitle>
          {/* CardDescription removed */}
        </CardHeader>
        <CardContent>
          {/* Content from former CardDescription */}
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Anything in Anykeys は、思いついた音楽フレーズや練習中のリックなどを「ABC Notation」というテキスト形式で手軽に記録し、管理、そして共有できる場所です。
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
            <li>
              <span className="font-medium">マイフレーズ管理:</span> 自分だけのフレーズライブラリを作成・整理できます。
            </li>
            <li>
              <span className="font-medium">ABC Notation プレビュー:</span> 入力したテキストがリアルタイムで楽譜として表示されます。
            </li>
            <li>
              <span className="font-medium">フレーズ共有 (予定):</span> 作成したフレーズを他のユーザーと共有し、学び合うことができます。（現在開発中）
            </li>
            <li>
              <span className="font-medium">どこでもアクセス:</span> Webブラウザがあれば、いつでもどこでもあなたのフレーズにアクセスできます。
            </li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            作曲家、演奏家、音楽学習者など、音楽に関わるすべての人々のためのツールを目指しています。
          </p>
        </CardContent>
      </Card>

      {/* ABC Notation Introduction Section */}
      <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300"> {/* Add shadow */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">ABC Notation って？</CardTitle>
          {/* CardDescription removed - Integrated below */}
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            楽譜をシンプルなテキストで表現するための世界共通の方法です。音符、リズム、調号、コードなどを文字や記号で記述します。
          </p>
          <p className="mb-3 font-medium">基本的な「ドレミファソラシド」の例:</p>
          {/* Use template literal for proper newline rendering in pre tag */}
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 text-sm overflow-x-auto shadow-inner whitespace-pre-wrap"> {/* Add whitespace-pre-wrap */}
            <code className="dark:text-gray-300">
              {`X:1
T:ドレミ
M:4/4
L:1/4
K:C
C D E F | G A B c |]`}
            </code>
          </pre>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            最初は少し戸惑うかもしれませんが、いくつかの基本的なルールを覚えれば、驚くほど簡単に楽譜をテキストで扱えるようになります。
            より詳しい書き方や便利な機能については、専用のヘルプガイドで確認できます。
          </p>
          <Link href="/help/abc-notation" passHref>
            {/* Adjusted Button Colors (slightly less vivid hover) */}
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              ABC Notation ガイドを見る
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Let's Get Started Section */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900"> {/* Add shadow and gradient */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">さっそく始めよう！</CardTitle>
        </CardHeader>
        <CardContent className="text-center"> {/* Center content */}
          <p className="mb-6 text-lg text-gray-800 dark:text-gray-200">
            準備はできましたか？<br />「マイフレーズ」ページで最初のフレーズを作成してみましょう！
          </p>
          <Link href="/dashboard" passHref>
            {/* Adjusted Button Colors (slightly less vivid hover) */}
            <Button
              variant="secondary"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center mx-auto"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              マイフレーズへ移動
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialPage;
