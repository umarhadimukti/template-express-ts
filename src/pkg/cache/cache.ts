import { getRedis } from "@/bootstrap/redis";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await getRedis().get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await getRedis().setex(key, ttlSeconds, serialized);
  } else {
    await getRedis().set(key, serialized);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length > 0) await getRedis().del(...keys);
}

export async function cacheExists(key: string): Promise<boolean> {
  return (await getRedis().exists(key)) === 1;
}

export async function cacheTTL(key: string): Promise<number> {
  return getRedis().ttl(key);
}

// hapus semua key yang cocok dengan pattern, misal: "user:*"
export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) await getRedis().del(...keys);
}

// cache-aside pattern: ambil dari cache, jika miss jalankan fetcher lalu simpan
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
