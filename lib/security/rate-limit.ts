import { checkRedisRateLimit } from "@/lib/security/rate-limit-redis";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type RateLimitBucket = {
  count: number;
  windowStart: number;
  windowMs: number;
};

const authBuckets = new Map<string, RateLimitBucket>();
const generalBuckets = new Map<string, RateLimitBucket>();
const lastPurgeAtByWindow = new Map<number, number>();

const MAX_AUTH_BUCKETS = 10_000;
const MAX_GENERAL_BUCKETS = 10_000;

function getBucketStore(key: string): {
  store: Map<string, RateLimitBucket>;
  maxBuckets: number;
} {
  if (key.startsWith("auth:")) {
    return { store: authBuckets, maxBuckets: MAX_AUTH_BUCKETS };
  }

  return { store: generalBuckets, maxBuckets: MAX_GENERAL_BUCKETS };
}

function purgeExpiredBuckets(
  store: Map<string, RateLimitBucket>,
  now: number
): void {
  for (const [key, bucket] of store) {
    if (now - bucket.windowStart >= bucket.windowMs) {
      store.delete(key);
    }
  }
}

function enforceMaxBuckets(
  store: Map<string, RateLimitBucket>,
  maxBuckets: number
): void {
  if (store.size <= maxBuckets) {
    return;
  }

  const now = Date.now();
  purgeExpiredBuckets(store, now);

  if (store.size <= maxBuckets) {
    return;
  }

  const overflow = store.size - maxBuckets;
  const sorted = [...store.entries()].sort(
    (left, right) => left[1].windowStart - right[1].windowStart
  );

  for (const [key] of sorted.slice(0, overflow)) {
    store.delete(key);
  }
}

function maybePurgeExpiredBuckets(
  store: Map<string, RateLimitBucket>,
  now: number,
  windowMs: number
): void {
  const lastPurgeAt = lastPurgeAtByWindow.get(windowMs) ?? 0;

  if (now - lastPurgeAt >= windowMs || store.size > MAX_GENERAL_BUCKETS) {
    purgeExpiredBuckets(store, now);
    lastPurgeAtByWindow.set(windowMs, now);
  }
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const { store, maxBuckets } = getBucketStore(key);
  maybePurgeExpiredBuckets(store, now, windowMs);

  const bucket = store.get(key);

  if (!bucket || now - bucket.windowStart >= bucket.windowMs) {
    store.set(key, { count: 1, windowStart: now, windowMs });
    enforceMaxBuckets(store, maxBuckets);

    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (bucket.windowMs - (now - bucket.windowStart)) / 1000
      ),
    };
  }

  bucket.count += 1;

  return { allowed: true };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): Promise<RateLimitResult> {
  if (process.env.REDIS_URL) {
    return checkRedisRateLimit(key, limit, windowMs, now);
  }

  return checkMemoryRateLimit(key, limit, windowMs, now);
}

export function resetRateLimitsForTests(): void {
  authBuckets.clear();
  generalBuckets.clear();
  lastPurgeAtByWindow.clear();
}
