interface TokenBucket {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
}

export interface TokenBucketOptions {
  capacity: number;
  refillIntervalMs: number;
  idleTimeoutMs?: number;
  maxBuckets?: number;
}

export class BoundedTokenBucket {
  private readonly buckets = new Map<string, TokenBucket>();
  private lastCleanup = 0;
  private readonly idleTimeoutMs: number;
  private readonly maxBuckets: number;

  constructor(
    private readonly options: TokenBucketOptions,
    private readonly now: () => number = Date.now
  ) {
    this.idleTimeoutMs = options.idleTimeoutMs ?? 10 * 60 * 1000;
    this.maxBuckets = options.maxBuckets ?? 10_000;
  }

  consume(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = this.now();
    this.cleanupExpired(now);

    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) {
        this.cleanupExpired(now, true);
        if (this.buckets.size >= this.maxBuckets) {
          return { allowed: false, retryAfterSeconds: 60 };
        }
      }

      bucket = {
        tokens: this.options.capacity,
        lastRefill: now,
        lastSeen: now,
      };
      this.buckets.set(key, bucket);
    } else {
      const elapsed = Math.max(0, now - bucket.lastRefill);
      bucket.tokens = Math.min(
        this.options.capacity,
        bucket.tokens + elapsed / this.options.refillIntervalMs
      );
      bucket.lastRefill = now;
      bucket.lastSeen = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((1 - bucket.tokens) * this.options.refillIntervalMs / 1000)
      ),
    };
  }

  get size(): number {
    return this.buckets.size;
  }

  private cleanupExpired(now: number, force = false): void {
    if (!force && now - this.lastCleanup < 60_000) return;
    this.lastCleanup = now;
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastSeen >= this.idleTimeoutMs) this.buckets.delete(key);
    }
  }
}
