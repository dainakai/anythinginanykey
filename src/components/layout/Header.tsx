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
    { href: '/help/abc-notation', title: 'ABC Notation ガイド', description: 'ABC Notation の基本的な書き方を解説します。' },
    // Add other help items here
  ];

  return (
    <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50"> {/* Added sticky and z-index */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Anything in Anykeys
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1"> {/* Adjusted space-x */}
          {session && (
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <Link href={link.href} legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        {link.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}

                {/* Help Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                     <QuestionMarkCircleIcon className="h-5 w-5 mr-1 inline" /> ヘルプ
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] ">
                      {helpLinks.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {/* Settings Icon */}
                <NavigationMenuItem>
                   <Link href="/settings" legacyBehavior passHref>
                     <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                       <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" title="設定" />
                       <span className="sr-only">設定</span>
                     </NavigationMenuLink>
                   </Link>
                 </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
          <div className="ml-2"> {/* Position AuthButton slightly to the right */}
            <AuthButton />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {session && (
             <Link href="/settings" className="text-gray-400 hover:text-white mr-2" title="設定">
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
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
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
                 <span className="text-gray-400 px-3 py-2 text-xs font-medium uppercase">ヘルプ</span>
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


export default Header;
