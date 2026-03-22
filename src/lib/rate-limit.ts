import Redis from "ioredis";
import { headers } from "next/headers";

let redisInstance: Redis | null = null;

function createRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError: (err) => {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "Connection is closed"];
      return targetErrors.some((e) => err.message.includes(e));
    },
    enableOfflineQueue: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
  });

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  client.on("reconnecting", () => {
    console.log("Redis reconnecting...");
  });

  return client;
}

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  
  if (!redisInstance || redisInstance.status !== "ready") {
    redisInstance = createRedisClient();
  }
  
  return redisInstance;
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}

interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

const configs: Record<string, RateLimitConfig> = {
  default: { requests: 100, windowSeconds: 60 },
  strict: { requests: 20, windowSeconds: 60 },
  write: { requests: 40, windowSeconds: 60 },
};

async function slidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const r = getRedis();
  if (!r) return { success: true, remaining: 999, reset: 0 };

  const key = `quark:rl:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  try {
    const pipeline = r.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key, config.windowSeconds);

    const results = await pipeline.exec();

    if (!results) return { success: true, remaining: 999, reset: 0 };

    const count = (results[2]?.[1] as number) || 0;
    const success = count < config.requests;
    const remaining = Math.max(0, config.requests - count);
    const reset = now + config.windowSeconds * 1000;

    return { success, remaining, reset };
  } catch (error) {
    console.error("Rate limit error:", error);
    return { success: true, remaining: 999, reset: 0 };
  }
}

export async function checkRateLimit(
  type: "default" | "strict" | "write" = "default",
  identifier?: string,
): Promise<{ success: boolean; remaining: number }> {
  const headerStore = await headers();
  const ip =
    identifier ??
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";

  const result = await slidingWindowRateLimit(ip, configs[type] || configs.default);
  return { success: result.success, remaining: result.remaining };
}

export async function requireRateLimit(
  type: "default" | "strict" | "write" = "default",
  identifier?: string,
) {
  const { success } = await checkRateLimit(type, identifier);
  if (!success) {
    throw new Error("Too many requests. Please slow down.");
  }
}
