import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">ページが見つかりません</h2>
      <p className="text-gray-600 mb-8">お探しのページは存在しないか、移動された可能性があります。</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        トップページに戻る
      </Link>
    </div>
  );
} 