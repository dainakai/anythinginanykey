// Legacy next-auth.d.ts type definitions - kept for reference
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
    } & DefaultSession["user"]; // Keep the default properties
  }

  /** The OAuth profile returned from your provider */
  interface User extends Record<string, unknown>, DefaultUser {
    // Add any custom properties for your User model here if needed in the future
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** OpenID ID Token */
    idToken?: string;
    // Add custom claims from your JWT callback if needed
  }
}
