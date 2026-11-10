/**
 * Small in-process TTL + LRU map for server modules.
 * Evicts expired entries on access/write and drops oldest inserts when over maxSize.
 */
export class TtlLruCache<T> {
  private readonly store = new Map<string, { value: T; expiresAtMs: number }>();

  constructor(private readonly maxSize: number) {
    if (maxSize < 1) {
      throw new Error("TtlLruCache maxSize must be at least 1.");
    }
  }

  get size() {
    return this.store.size;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAtMs <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU order.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, expiresAtMs: number) {
    if (expiresAtMs <= Date.now()) {
      this.store.delete(key);
      return;
    }

    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { value, expiresAtMs });
    this.evictExpired();
    this.evictOverflow();
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  private evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAtMs <= now) {
        this.store.delete(key);
      }
    }
  }

  private evictOverflow() {
    while (this.store.size > this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      this.store.delete(oldestKey);
    }
  }
}
