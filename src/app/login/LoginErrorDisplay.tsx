// src/app/login/LoginErrorDisplay.tsx
"use client"; // This component uses hooks, so it must be a client component

import { useSearchParams } from 'next/navigation';

export function LoginErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (!error) return null; // No error, render nothing

  // Map known NextAuth.js error codes to user-friendly messages
  // See: https://next-auth.js.org/configuration/pages#error-codes
  const errorMessages: { [key: string]: string } = {
    Signin: "Try signing in with a different account.",
    OAuthSignin: "Try signing in with a different account.",
    OAuthCallback: "Try signing in with a different account.",
    OAuthCreateAccount: "Try signing in with a different account.",
    EmailCreateAccount: "Try signing in with a different account.",
    Callback: "Try signing in with a different account.",
    OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
    EmailSignin: "Check your email address.",
    CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
    default: "Unable to sign in."
  };

  const errorMessage = errorMessages[error] || errorMessages.default;

  return <div style={{ color: 'red', marginBottom: '1rem', marginTop: '1rem' }}>Error: {errorMessage}</div>;
}
