export const runtime = 'edge';

import AuthButton from "@/components/AuthButton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Music, BookOpen, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          音楽フレーズを、<span className="text-indigo-600 dark:text-indigo-400">あらゆるキー</span>でマスターしよう
        </h1>

        <p className="mt-4 text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          Anything in AnyKey は、ABC Notationで記録した音楽フレーズを瞬時に移調し、練習や共有を効率化するWebアプリケーションです。
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
          <AuthButton />
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Phrase Management */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center dark:text-white">
                   <Music className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                   フレーズ管理・移調
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 dark:text-gray-300">
                <p>ABC Notationでフレーズを記録し、瞬時に12キーすべてに移調。楽譜と音源で確認しながら効率的に練習できます。</p>
              </CardContent>
            </Card>

            {/* Feature 2: ABC Notation */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center dark:text-white">
                   <BookOpen className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                   ABC Notation サポート
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 dark:text-gray-300">
                <p>シンプルなテキスト形式「ABC Notation」で楽譜を記述。リアルタイムプレビューで確認しながら入力できます。</p>
              </CardContent>
            </Card>

            {/* Feature 3: Sharing (Placeholder) */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   フレーズ共有（予定）
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 dark:text-gray-300">
                <p>作成したフレーズを他のユーザーと共有し、新たな発見や学びを得られるコミュニティ機能（開発中）。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ABC Notation Intro Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            ABC Notation とは？
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 text-center">
            楽譜をシンプルなテキストで表現するための世界共通の方法です。音符、リズム、調号などを文字や記号で記述します。
          </p>
          <Card className="mb-8 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold dark:text-white">基本的な「ドレミファソラシド」の例:</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-4 text-sm overflow-x-auto shadow-inner">
                <code className="text-gray-800 dark:text-gray-200">
                  {`T:ドレミ\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`}
                </code>
              </pre>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                最初は少し難しく感じるかもしれませんが、基本的なルールを覚えれば、簡単に楽譜をテキストで扱えるようになります。
              </p>
              <Link href="/help/abc-notation" passHref>
                 <Button variant="outline" className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 flex items-center mx-auto">
                   <BookOpen className="w-4 h-4 mr-2" />
                   ABC Notation ガイドを見る
                 </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

       {/* Call to Action Section */}
       <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            さあ、始めましょう！
          </h2>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            今すぐサインアップして、あなたの音楽フレーズを記録し、あらゆるキーでの練習を始めましょう。
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <AuthButton />
            <Link href="/dashboard" passHref>
              <Button variant="secondary" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 flex items-center font-semibold">
                <ArrowRight className="w-5 h-5 mr-2" />
                ダッシュボードへ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="w-full py-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Anything in AnyKey. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
