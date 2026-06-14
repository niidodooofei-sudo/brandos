// Simple in-memory rate limiter. For production, replace with Redis-backed limiter.
const windows = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = windows.get(key)

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

// Prune expired entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of windows.entries()) {
    if (now > val.resetAt) windows.delete(key)
  }
}, 5 * 60 * 1000)
