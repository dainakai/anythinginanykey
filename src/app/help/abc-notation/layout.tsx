import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABC Notation ガイド - Anything in AnyKey',
  description: 'Anything in AnyKey で使用する ABC Notation の入力方法についてのガイドです。',
};

export default function AbcNotationHelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // レイアウトはシンプルに子要素を返すだけ
}
