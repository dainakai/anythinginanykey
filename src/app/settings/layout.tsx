'use client';

// src/app/settings/layout.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Client Componentにするため

// サイドバーナビゲーション項目
const sidebarNavItems = [
  {
    title: "プロフィール",
    href: "/settings/profile",
  },
  // {
  //   title: "アカウント",
  //   href: "/settings/account",
  // },
  // {
  //   title: "支払い情報",
  //   href: "/settings/billing",
  // },
  // ... 他の設定項目
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

// Client Component 内で usePathname を使うためのヘルパーコンポーネント
function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            pathname === item.href
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}


export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">設定</h1>
        <p className="text-gray-500">アカウントとアプリケーションの設定を管理します。</p>
      </div>
      <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12">
        <aside className="md:w-1/5">
          {/* Client Componentなので直接呼び出せる */}
          <SidebarNav />
        </aside>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
