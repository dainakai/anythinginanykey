'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TutorialPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ようこそ Anything in Anykeys へ！</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>このアプリについて</CardTitle>
          <CardDescription>
            Anything in Anykeys は、思いついた音楽フレーズを「ABC Notation」というテキスト形式で記録し、管理、共有できるアプリケーションです。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            自分だけのフレーズ集を作ったり、他のユーザーが作成したフレーズを参考にしたりできます。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ABC Notation って？</CardTitle>
          <CardDescription>
            楽譜をテキストで表現するためのシンプルな方法です。音符、リズム、調号などを文字や記号で記述します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2">例：基本的なドレミ</p>
          <pre className="bg-gray-100 p-3 rounded mb-4 text-sm overflow-x-auto dark:bg-gray-800 dark:text-gray-300">
            <code>
              X:1{/* 曲の番号 (必須) */}\n
              T:ドレミ{/* タイトル */}\n
              M:4/4{/* 拍子 */}\n
              L:1/4{/* 基本の音の長さ */}\n
              K:C{/* 調号 */}\n
              C D E F | G A B c |] {/* 音符 */}
            </code>
          </pre>
          <p className="mb-4">
            最初は難しく感じるかもしれませんが、基本的なルールを覚えればすぐに慣れます。
            詳しい書き方や記号の意味については、ヘルプガイドを参照してください。
          </p>
          <Link href="/help/abc-notation" passHref>
            <Button>ABC Notation ガイドを見る</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>さっそく始めよう！</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            まずは「マイフレーズ」ページで新しいフレーズを作成してみましょう！
          </p>
          <Link href="/dashboard" passHref>
            <Button variant="secondary">マイフレーズへ移動</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialPage;
