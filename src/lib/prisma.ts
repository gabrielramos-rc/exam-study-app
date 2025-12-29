// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Parse and validate an integer environment variable with optional range validation.
 * Throws an error if the value is not a valid integer or outside the specified range.
 */
function parseIntEnv(
  envVar: string,
  defaultValue: number,
  options?: { min?: number; max?: number }
): number {
  const value = process.env[envVar];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ${envVar}: "${value}" is not a valid integer`);
  }
  if (options?.min !== undefined && parsed < options.min) {
    throw new Error(`Invalid ${envVar}: ${parsed} is below minimum value of ${options.min}`);
  }
  if (options?.max !== undefined && parsed > options.max) {
    throw new Error(`Invalid ${envVar}: ${parsed} exceeds maximum value of ${options.max}`);
  }
  return parsed;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse and validate pool configuration with sensible ranges
  const poolMax = parseIntEnv('DB_POOL_MAX', 10, { min: 1, max: 100 });
  const poolIdleTimeout = parseIntEnv('DB_POOL_IDLE_TIMEOUT', 10000, { min: 0 });
  const poolConnectTimeout = parseIntEnv('DB_POOL_CONNECT_TIMEOUT', 5000, { min: 0 });

  // Reuse existing pool in development to prevent leaks during hot-reload
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: poolMax,
    idleTimeoutMillis: poolIdleTimeout,
    connectionTimeoutMillis: poolConnectTimeout,
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
