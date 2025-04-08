// src/components/AuthButton.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  const commonButtonStyles = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const signInStyles = "bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500";
  const signOutStyles = "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white";

  if (session) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className={`${commonButtonStyles} ${signOutStyles}`}
      >
        Sign out
      </button>
    );
  }
  return (
    <button
      onClick={() => signIn('google')}
      className={`${commonButtonStyles} ${signInStyles}`}
    >
      Sign in
    </button>
  );
}