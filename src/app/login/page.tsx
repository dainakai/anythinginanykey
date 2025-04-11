// src/app/login/page.tsx
'use client' // Mark as a Client Component

import { Suspense } from 'react';
import { LoginErrorDisplay } from './LoginErrorDisplay'; // Import the error display component
import { supabase } from '@/lib/supabase/client'; // Import Supabase client

export default function LoginPage() {

  const handleGoogleSignIn = async () => {
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
