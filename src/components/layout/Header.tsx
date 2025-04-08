'use client'; // Use client directive for useState and event handlers

import React, { useState } from 'react'; // Import React
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
// Updated import path for heroicons v2.x and add QuestionMarkCircleIcon
import { Bars3Icon, XMarkIcon, Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"; // Import shadcn/ui NavigationMenu components
import { cn } from "@/lib/utils"; // Import cn utility

// ListItem component (from shadcn/ui docs)
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors", // Removed default hover/focus colors
            "hover:bg-gray-700 focus:bg-gray-700", // Use dark hover/focus
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-white">{title}</div> {/* Ensure title text is visible */}
          <p className="line-clamp-2 text-sm leading-snug text-gray-400"> {/* Adjust description color */}
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

const Header = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/dashboard', label: 'マイフレーズ' },
    { href: '/global', label: 'みんなのフレーズ' },
  ];

  // Help menu items
  const helpLinks = [
    { href: '/tutorial', title: '初回チュートリアル', description: 'Anything in AnyKey の基本的な使い方を学びます。' },
    { href: '/help/abc-notation', title: 'ABC Notation ガイド', description: 'ABC Notation の書き方を詳しく解説します。' },
    { href: '/help/faq', title: 'よくある質問', description: 'サービスに関するよくある質問と回答です。' },
    // Add other help items here
  ];

  // Unified style for all navigation items including Help trigger
  const navLinkStyle = cn(
    navigationMenuTriggerStyle(),
    "bg-transparent text-white", // Base colors
    "hover:bg-gray-700 hover:text-white", // Hover state (dark background, white text)
    "focus:bg-gray-700 focus:text-white", // Focus state (dark background, white text)
    // Open state: Keep dark background BUT change text to dark
    "data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900", // Dark text when open
    "transition-colors duration-200 ease-in-out" // Animation
  );

  return (
    <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50"> {/* Added sticky and z-index */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Anything in AnyKey
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2"> {/* Adjusted space */}
          {session && (
            <> {/* Use Fragment to group NavMenu and Settings Link */}
              <NavigationMenu>
                <NavigationMenuList>
                  {navLinks.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <Link href={link.href} legacyBehavior passHref>
                        {/* Use the common style */}
                        <NavigationMenuLink className={navLinkStyle}>
                          {link.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}

                  {/* Help Menu */}
                  <NavigationMenuItem>
                    {/* Apply the unified style to the trigger */}
                    <NavigationMenuTrigger className={navLinkStyle}>
                       <QuestionMarkCircleIcon className="h-5 w-5 mr-1 inline" /> ヘルプ
                    </NavigationMenuTrigger>
                     {/* Add NavigationMenuContent back */}
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

              {/* Settings Icon (Moved outside NavigationMenu) */}
              <Link href="/settings" className="p-2 text-gray-300 hover:text-white transition-colors duration-200 ease-in-out" title="設定">
                 <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
                 <span className="sr-only">設定</span>
              </Link>
            </>
          )}
          <div className="ml-2"> {/* Position AuthButton slightly to the right */}
            <AuthButton />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {session && (
             <Link href="/settings" className="text-gray-300 hover:text-white mr-2" title="設定"> {/* Keep mobile settings link simple */}
               <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
             </Link>
           )}
           {session && (
             <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            )}
             {/* Show AuthButton next to burger if no session, or adjust layout as needed */}
             {!session && <div className="ml-2"><AuthButton /></div>}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {session && (
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-gray-800`} id="mobile-menu"> {/* Ensure mobile menu has dark background */}
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  {link.label}
                </Link>
              ))}
               {/* Mobile Help Menu */}
               <div>
                 <span className="text-gray-400 px-3 py-2 text-xs font-medium uppercase">ヘルプ & ガイド</span>
                 {helpLinks.map((link) => (
                   <Link
                     key={link.href}
                     href={link.href}
                     className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                     onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                   >
                     {link.title}
                   </Link>
                 ))}
               </div>

              <Link
                href="/settings"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
              >
                設定
              </Link>
            </div>
            {/* Auth Button inside mobile menu if user is logged in */}
            <div className="pt-4 pb-3 border-t border-gray-700 px-5">
                 <AuthButton />
            </div>
          </div>
      )}
    </header>
  );
};

export default Header;
