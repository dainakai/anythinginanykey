import React from 'react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { Cog6ToothIcon, QuestionMarkCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
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
import { createClient } from '@/utils/supabase/server';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const logoHref = user ? '/dashboard' : '/';

  const navLinks = [
    { href: '/dashboard', label: 'マイフレーズ' },
    { href: '/global', label: 'みんなのフレーズ' },
  ];

  const helpLinks = [
    { href: '/', title: 'アプリ紹介 (LP)', description: 'Anything in AnyKey の機能や使い方を紹介します。' },
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
        <Link href={logoHref} className="text-xl font-bold hover:text-gray-300">
          Anything in AnyKey
        </Link>

        {/* Desktop Navigation */}
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
            </>
          )}
          <div className="ml-2">
            <AuthButton user={user} />
          </div>
        </nav>

        {/* Mobile Navigation & Auth Button */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="ml-auto">
            <AuthButton user={user} />
          </div>
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                  <Bars3Icon className="h-6 w-6" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-800 text-white border-l border-gray-700 p-0">
                <SheetHeader className="p-4 border-b border-gray-700">
                  <SheetTitle className="text-white text-lg">メニュー</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-4">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                       <Link
                         href={link.href}
                         className="block p-3 rounded-md text-base font-medium text-white hover:bg-gray-700"
                       >
                         {link.label}
                       </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href="/settings"
                      className="block p-3 rounded-md text-base font-medium text-white hover:bg-gray-700"
                    >
                      <Cog6ToothIcon className="w-5 h-5 mr-2 inline-block" /> 設定
                    </Link>
                  </SheetClose>
                  <div>
                    <h3 className="px-3 pt-2 pb-1 text-sm font-semibold text-gray-400">ヘルプ</h3>
                     {helpLinks.map((link) => (
                       <SheetClose asChild key={link.title}>
                         <Link
                           href={link.href}
                           className="block p-3 rounded-md text-base font-medium text-white hover:bg-gray-700"
                         >
                           {link.title}
                         </Link>
                       </SheetClose>
                     ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
