export interface RateLimitOptions {
  windowMs: number
  max: number
}

export interface RateLimitDecision {
  allowed: boolean
  retryAfterSeconds: number
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitDecision
}

interface Bucket {
  count: number
  resetAt: number
}

const MAX_TRACKED_KEYS = 5000

/**
 * Janela fixa em memória. Cada instância serverless tem o próprio balde, então
 * o limite é por instância e serve como freio de abuso, não como garantia exata.
 */
export function createRateLimiter({
  windowMs,
  max,
}: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, Bucket>()

  function discardExpired(now: number): void {
    if (buckets.size < MAX_TRACKED_KEYS) return

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }

  return {
    check(key, now = Date.now()) {
      const current = buckets.get(key)

      if (!current || current.resetAt <= now) {
        discardExpired(now)
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, retryAfterSeconds: 0 }
      }

      if (current.count >= max) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
        }
      }

      current.count += 1
      return { allowed: true, retryAfterSeconds: 0 }
    },
  }
}
