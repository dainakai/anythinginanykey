// src/components/AuthButton.tsx
"use client";

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { User, SupabaseClient } from '@supabase/supabase-js'; // Import Supabase User and Client types
import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';
import { Button } from './ui/button';

// Simplified component focusing only on Auth logic
export default function AuthButton({ user }: { user: User | null }) {
  const router = useRouter();
  const [_loading, setLoading] = useState(!user); // renamed to _loading to avoid linting error
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  
  // Initialize Supabase client only on the client side
  useEffect(() => {
    setSupabase(createClient());
  }, []);
  
  // If user not provided via props, fetch from Supabase
  useEffect(() => {
    if (user) {
      return;
    }
    
    if (!supabase) return; // Skip if supabase client not initialized
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        user = fetchedUser;
      } catch (error) {
        console.error('Error fetching user:', error);
        user = null;
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      user = session?.user ?? null;
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [user, supabase]);

  const handleSignIn = async () => {
    if (!supabase) return;
    
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
    if (!supabase) return;
    
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

  // Use the passed user prop instead of useSession
  if (user) {
    return (
      <Button onClick={handleSignOut} variant="ghost" className="text-white hover:bg-gray-700 hover:text-white">
        ログアウト
      </Button>
    );
  }
  return (
    <Button onClick={handleSignIn} variant="default" className="bg-white hover:bg-gray-100 text-indigo-600 font-semibold border border-indigo-300 shadow-sm">
      <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c61.8 0 119.5 21.8 162.8 60.1l-66.6 66.6C314.6 95.6 282.5 80 244 80 149.6 80 72 158.4 72 256s77.6 176 172 176c82.8 0 129.7-33.2 154.2-65.1H244v-88.8h236.1c2.3 12.7 3.9 24.9 3.9 41.7z"></path></svg>
      Sign in with Google
    </Button>
  );
}