import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function makeRatelimiter(requests: number, windowSeconds: number) {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });
}

// Lazy singletons — constructed on first call so missing env vars in test
// environments don't break imports.
let _checkout: Ratelimit | null = null;
let _orders: Ratelimit | null = null;

export function checkoutLimiter() {
  _checkout ??= makeRatelimiter(5, 60);
  return _checkout;
}

export function ordersLimiter() {
  _orders ??= makeRatelimiter(10, 60);
  return _orders;
}
