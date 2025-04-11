// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from '@neondatabase/serverless';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Edge RuntimeかNode.jsかを検出する関数
function isEdgeRuntime() {
  return process.env.NEXT_RUNTIME === 'edge';
}

// Edgeランタイム用のPrismaClientを作成
function createPrismaClientEdge() {
  // プール設定でNeon Serverlessを使用
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  // アダプターを使ってPrismaClientを初期化
  return new PrismaClient({ adapter });
}

// 通常のPrismaClientを作成
function createPrismaClientNode() {
  return new PrismaClient({
    // log: ['query'], // Uncomment to log Prisma queries
  });
}

// 環境に応じたPrismaClientを選択
export const prisma = global.prisma || (
  isEdgeRuntime() 
    ? createPrismaClientEdge() 
    : createPrismaClientNode()
);

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
