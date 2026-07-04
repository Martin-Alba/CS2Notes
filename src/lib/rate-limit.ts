import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit",
  analytics: true,
});

export const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "ratelimit-strict",
  analytics: true,
});
