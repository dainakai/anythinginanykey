// src/app/login/page.tsx
'use client' // Mark as a Client Component

import { Suspense, useEffect, useState } from 'react';
import { LoginErrorDisplay } from './LoginErrorDisplay'; // Import the error display component
import { createClient } from '@/utils/supabase/client'; // Import Supabase client creator instead of singleton
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export default function LoginPage() {
  // SupabaseクライアントをuseEffect内で初期化して、サーバーサイドレンダリング時に実行されないようにする
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    // クライアントサイドでのみクライアントを初期化
    setSupabase(createClient());
  }, []);

  const handleGoogleSignIn = async () => {
    if (!supabase) return; // まだ初期化されていない場合は何もしない
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`, // Ensure you have a callback route
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
      // Handle error appropriately, maybe update state to show error message
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Login Required</h1>
      <p>Please log in to continue.</p>
      {/* Wrap ErrorDisplay in Suspense as it uses useSearchParams */}
      <Suspense fallback={<div>Loading messages...</div>}>
        <LoginErrorDisplay />
      </Suspense>
      {/* Remove form action, use button onClick */}
      <button
        onClick={handleGoogleSignIn}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '1rem' // Add some margin
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
