'use client'; // Use client directive for useState and event handlers

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
// Updated import path for heroicons v2.x
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/dashboard', label: 'マイフレーズ' },
    { href: '/global', label: 'みんなのフレーズ' }, // Corrected path
    // Add other navigation links as needed
  ];

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Anything in Anykeys
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {session && navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
              {link.label}
            </Link>
          ))}
          <AuthButton />
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
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
