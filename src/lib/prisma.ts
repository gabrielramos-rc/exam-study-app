// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Reuse existing pool in development to prevent leaks during hot-reload
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '10000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT ?? '5000', 10),
  });
  globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma and close the connection pool.
 * Called automatically on SIGTERM/SIGINT for clean shutdown.
 */
async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
}

// Register graceful shutdown handlers (only in production to avoid issues with hot-reload)
if (process.env.NODE_ENV === 'production') {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await disconnectPrisma();
      console.log('Prisma disconnected successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default prisma;
