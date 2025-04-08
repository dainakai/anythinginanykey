import AbcNotationGuide from '@/components/Help/AbcNotationGuide';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABC Notation ガイド - Anything in Anykeys',
  description: 'Anything in Anykeys で使用する ABC Notation の入力方法についてのガイドです。',
};

export default function AbcNotationGuidePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ABC Notation 入力ガイド</h1>
      <AbcNotationGuide />
    </main>
  );
}
