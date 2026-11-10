import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

/** Keep the pool small on Render Starter (512 MB) so idle connections do not dominate RAM. */
const PRISMA_POOL_MAX = 5;

function createPrismaPool(connectionString: string) {
  const useSsl =
    !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

  return new Pool({
    connectionString,
    max: PRISMA_POOL_MAX,
    idleTimeoutMillis: 30_000,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const pool = globalForPrisma.prismaPool ?? createPrismaPool(connectionString);
  globalForPrisma.prismaPool = pool;

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
