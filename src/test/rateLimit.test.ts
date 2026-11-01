import { describe, expect, it } from 'vitest';
import { BoundedTokenBucket } from '../lib/rateLimit';

describe('bounded API token buckets', () => {
  it('limits requests and refills tokens at the configured interval', () => {
    let now = 1_000;
    const limiter = new BoundedTokenBucket({
      capacity: 2,
      refillIntervalMs: 1_000,
      idleTimeoutMs: 10_000,
    }, () => now);

    expect(limiter.consume('client').allowed).toBe(true);
    expect(limiter.consume('client').allowed).toBe(true);
    expect(limiter.consume('client')).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    now += 1_000;
    expect(limiter.consume('client').allowed).toBe(true);
  });

  it('bounds client entries and reclaims buckets after inactivity', () => {
    let now = 1_000;
    const limiter = new BoundedTokenBucket({
      capacity: 3,
      refillIntervalMs: 1_000,
      idleTimeoutMs: 2_000,
      maxBuckets: 2,
    }, () => now);

    expect(limiter.consume('client-a').allowed).toBe(true);
    expect(limiter.consume('client-b').allowed).toBe(true);
    expect(limiter.size).toBe(2);
    expect(limiter.consume('client-c').allowed).toBe(false);
    expect(limiter.size).toBe(2);

    now += 2_001;
    expect(limiter.consume('client-c').allowed).toBe(true);
    expect(limiter.size).toBe(1);
  });
});
