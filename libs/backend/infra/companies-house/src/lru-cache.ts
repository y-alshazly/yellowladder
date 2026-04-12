interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Minimal TTL-bounded LRU cache — no dependency overhead. Keyed by string;
 * values are arbitrary. When capacity is reached the oldest entry is evicted.
 *
 * Used by `CompaniesHouseService` to cache search/lookup responses for 15
 * minutes (per architect §5.5).
 */
export class LruTtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly capacity: number,
    private readonly defaultTtlMs: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Touch for LRU ordering
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.capacity) {
      const oldest = this.store.keys().next().value;
      if (typeof oldest === 'string') {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }
}
