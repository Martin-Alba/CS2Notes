import { Redis } from "@upstash/redis";

function createPipeline() {
  const stack: (() => void)[] = [];
  const proxy = new Proxy({} as Record<string, unknown>, {
    get() {
      return () => {
        stack.push(() => {});
        return proxy;
      };
    },
  }) as unknown as ReturnType<Redis["multi"]>;

  return Object.assign(proxy, {
    exec: async () => {
      const r = stack.map(() => "OK");
      stack.length = 0;
      return r;
    },
  });
}

function createMockRedis() {
  return {
    get: async () => null,
    set: async () => "OK",
    publish: async () => 0,
    subscribe: async () => ({ unsubscribe: () => {} }),
    eval: async () => [0, null] as [number, string | null] | [0],
    evalsha: async () => [0, null] as [number, string | null] | [0],
    multi: () => createPipeline(),
    hset: async () => 0,
    sadd: async () => 0,
    sdiffstore: async () => 0,
    sunionstore: async () => 0,
  } as unknown as Redis;
}

function createRedisClient() {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    return Redis.fromEnv();
  }
  return createMockRedis();
}

export const redis = createRedisClient();
