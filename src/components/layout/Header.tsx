import React from 'react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { Bars3Icon, XMarkIcon, Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "hover:bg-gray-700 focus:bg-gray-700",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-white">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-400">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem"

const Header = async () => {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const navLinks = [
    { href: '/dashboard', label: 'マイフレーズ' },
    { href: '/global', label: 'みんなのフレーズ' },
  ];

  const helpLinks = [
    { href: '/tutorial', title: '初回チュートリアル', description: 'Anything in AnyKey の基本的な使い方を学びます。' },
    { href: '/help/abc-notation', title: 'ABC Notation ガイド', description: 'ABC Notation の書き方を詳しく解説します。' },
    { href: '/help/faq', title: 'よくある質問', description: 'サービスに関するよくある質問と回答です。' },
  ];

  const navLinkStyle = cn(
    navigationMenuTriggerStyle(),
    "bg-transparent text-white",
    "hover:bg-gray-700 hover:text-white",
    "focus:bg-gray-700 focus:text-white",
    "data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900",
    "transition-colors duration-200 ease-in-out"
  );

  return (
    <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Anything in AnyKey
        </Link>

        <nav className="hidden md:flex items-center space-x-2">
          {user && (
            <>
              <NavigationMenu>
                <NavigationMenuList>
                  {navLinks.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <Link href={link.href} legacyBehavior passHref>
                        <NavigationMenuLink className={navLinkStyle}>
                          {link.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className={navLinkStyle}>
                       <QuestionMarkCircleIcon className="h-5 w-5 mr-1 inline" /> ヘルプ
                    </NavigationMenuTrigger>
                     <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] bg-gray-800 border border-gray-700">
                        {helpLinks.map((component) => (
                          <ListItem
                            key={component.title}
                            title={component.title}
                            href={component.href}
                            className="hover:bg-gray-700 focus:bg-gray-700"
                          >
                            {component.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link href="/settings" className="p-2 text-gray-300 hover:text-white transition-colors duration-200 ease-in-out" title="設定">
                 <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
                 <span className="sr-only">設定</span>
              </Link>
            </>
          )}
          <div className="ml-2">
            <AuthButton user={user} />
          </div>
        </nav>

        <div className="md:hidden flex items-center">
           <AuthButton user={user} />
        </div>
      </div>
    </header>
  );
};

export default Header;
