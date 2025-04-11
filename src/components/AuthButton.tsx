// src/components/AuthButton.tsx
"use client";

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js'; // Import Supabase User type
import { useEffect, useState } from 'react';

interface AuthButtonProps {
  user?: User | null; // Optional user prop, will fetch if not provided
}

export default function AuthButton({ user: propUser }: AuthButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(propUser ?? null);
  const [loading, setLoading] = useState(!propUser);
  const supabase = createClient();
  
  // If user not provided via props, fetch from Supabase
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      return;
    }
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [propUser, supabase]);

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
      // Optionally, redirect to login with error or display message
      router.push('/login?error=signin_failed');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      // Handle error appropriately
    } else {
      // Redirect to home page and refresh to update server components
      router.push('/');
      router.refresh();
    }
  };

  const commonButtonStyles = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const signInStyles = "bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500";
  const signOutStyles = "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white";

  // Use the passed user prop instead of useSession
  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className={`${commonButtonStyles} ${signOutStyles}`}
      >
        Sign out
      </button>
    );
  }
  return (
    <button
      onClick={handleSignIn}
      className={`${commonButtonStyles} ${signInStyles}`}
    >
      Sign in
    </button>
  );
}