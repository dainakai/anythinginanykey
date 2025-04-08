// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    // log: ['query'], // Uncomment to log Prisma queries
  }).$extends(withAccelerate());
};

export const prisma =
  global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
