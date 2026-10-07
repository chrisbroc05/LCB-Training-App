export type PendingTestResult = {
  id: string;
  sessionId: string;
  playerId: string;
  metricKey: string;
  attempts?: number[];
  absent?: boolean;
  skipped?: boolean;
  notes?: string | null;
  createdAt: string;
};

const STORAGE_KEY = "lcb-testing-pending-results";

function readQueue(): PendingTestResult[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PendingTestResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingTestResult[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listPendingTestResults() {
  return readQueue();
}

export function enqueuePendingTestResult(
  entry: Omit<PendingTestResult, "id" | "createdAt">,
) {
  const queue = readQueue();
  const filtered = queue.filter(
    (item) =>
      !(
        item.sessionId === entry.sessionId &&
        item.playerId === entry.playerId &&
        item.metricKey === entry.metricKey
      ),
  );
  const next: PendingTestResult = {
    ...entry,
    id: `${entry.sessionId}:${entry.playerId}:${entry.metricKey}:${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeQueue([next, ...filtered]);
  return next;
}

export function removePendingTestResult(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export async function flushPendingTestResults() {
  const queue = readQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(`/api/admin/testing/sessions/${item.sessionId}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: item.playerId,
          metricKey: item.metricKey,
          attempts: item.attempts,
          absent: item.absent,
          skipped: item.skipped,
          notes: item.notes,
        }),
      });
      if (!response.ok) {
        failed += 1;
        continue;
      }
      removePendingTestResult(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
