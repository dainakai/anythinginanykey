// src/app/login/page.tsx
import { signIn } from "@/auth"; // Use signIn from src/auth.ts
import { Suspense } from 'react';
import { LoginErrorDisplay } from './LoginErrorDisplay'; // Import the error display component

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Login Required</h1>
      <p>Please log in to continue.</p>
      {/* Wrap ErrorDisplay in Suspense as it uses useSearchParams */}
      <Suspense fallback={<div>Loading messages...</div>}>
        <LoginErrorDisplay />
      </Suspense>
      <form
        action={async () => {
          "use server";
          // Redirect to home page after successful Google sign in
          await signIn("google", { redirectTo: "/" }); 
        }}
      >
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer',
            marginTop: '1rem' // Add some margin
          }}
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
