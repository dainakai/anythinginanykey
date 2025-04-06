// middleware.ts
import { auth } from "@/auth"; // Assuming auth() is exported from here (created src/auth.ts)

export default auth((req) => {
  // req.auth is automatically set if the user is authenticated
  // Redirect unauthenticated users trying to access protected routes (excluding /login itself)
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin);
    // Check if the route is intended to be protected before redirecting
    // You might want more specific logic here based on your application's needs
    // For now, redirecting if not authenticated and not already on /login
    if (!req.nextUrl.pathname.startsWith('/api') && // Exclude API routes
        !req.nextUrl.pathname.startsWith('/_next') && // Exclude Next.js internal routes
        req.nextUrl.pathname !== '/' && // Allow access to homepage for now
        req.nextUrl.pathname !== '/favicon.ico') {
           console.log(`Redirecting unauthenticated user from ${req.nextUrl.pathname} to /login`);
           return Response.redirect(newUrl);
    }

  }
  // If authenticated or on a public route, continue without redirecting
  return undefined; // Explicitly return undefined to allow the request to continue
});

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  // Matcher updated to exclude specific public files and API routes,
  // but includes the root path ('/') and potentially other pages.
  // Adjust the matcher carefully based on which routes need protection.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
    '/', // Include the root path in the matcher if it needs protection or logic
  ],
};
