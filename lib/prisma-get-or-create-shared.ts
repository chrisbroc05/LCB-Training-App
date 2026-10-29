import { isPrismaUniqueViolation } from "@/lib/prisma-retry-shared";

/**
 * Run create(); on unique constraint (concurrent create), load existing with find().
 */
export async function createOrFindOnUniqueViolation<T>(
  create: () => Promise<T>,
  find: () => Promise<T | null>,
): Promise<T> {
  try {
    return await create();
  } catch (error) {
    if (!isPrismaUniqueViolation(error)) {
      throw error;
    }
    const existing = await find();
    if (!existing) {
      throw error;
    }
    return existing;
  }
}
