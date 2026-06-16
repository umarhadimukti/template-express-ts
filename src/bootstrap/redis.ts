import Redis from "ioredis";
import type { Config } from "#/config/config";
import { logger } from "#/pkg/logger/logger";

let redis: Redis | null = null;

export function initRedis(cfg: Config): Redis {
  if (redis) return redis;

  redis = new Redis(cfg.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times) => {
      if (times > 5) {
        logger.error("[REDIS]: Max retries reached. Giving up.");
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      logger.warn(`[REDIS]: Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
  });

  redis.on("connect", () => logger.info("[REDIS]: Connecting..."));
  redis.on("ready", () => logger.info("[REDIS]: Ready"));
  redis.on("error", (err) => logger.error(`[REDIS ERROR]: ${err.message}`));
  redis.on("close", () => logger.warn("[REDIS]: Connection closed"));
  redis.on("reconnecting", () => logger.warn("[REDIS]: Reconnecting..."));

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (!redis) return;
  await redis.quit();
  redis = null;
  logger.info("[REDIS]: Connection closed gracefully");
}

export function getRedis(): Redis {
  if (!redis) throw new Error("Redis not initialized. Call initRedis() first.");
  return redis;
}
