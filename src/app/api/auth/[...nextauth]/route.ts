// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
// import NextAuth from 'next-auth';
// import GoogleProvider from 'next-auth/providers/google';
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import prisma from "@/lib/prisma"; // Import the centralized Prisma client

export const runtime = 'edge';

export const { GET, POST } = handlers;

export const authOptions = {
  // ... existing code ...
};
