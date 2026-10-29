export function isPrismaTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: string; message?: string };
  if (record.code === "P2024" || record.code === "P1001" || record.code === "P1002") {
    return true;
  }

  const message = record.message ?? "";
  return message.includes("timed out") || message.includes("Connection terminated");
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { code?: string }).code === "P2002";
}

export async function withPrismaRetryOnce<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isPrismaTransientError(error)) {
      throw error;
    }
    return operation();
  }
}
