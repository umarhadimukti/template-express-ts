import dotenv from "dotenv";
import fs from "fs";
import path from "node:path";

export interface Config {
  APP_ENV: string;
  APP_PORT: number;
  APP_LOG_LEVEL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: string;
  DB_URL: string;
  REDIS_URL: string;
  REDIS_PORT: number;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  JWT_AT_SECRET: string;
  JWT_RT_SECRET: string;
  JWT_AT_EXPIRE: string;
  JWT_RT_EXPIRE: string;
}

export function loadConfig(): Config {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    console.warn(
      "⚠️  [.env.local] not found. Ensure environment variables are set in your system.",
    );
  } else {
    dotenv.config({ path: envPath });
  }

  try {
    const config = {
      APP_ENV: getEnv("APP_ENV", "local"),
      APP_PORT: getEnvNumber("APP_PORT", 3080),
      APP_LOG_LEVEL: getEnv("APP_LOG_LEVEL", "info"),
      DB_HOST: getEnv("DB_HOST", "127.0.0.1"),
      DB_PORT: getEnvNumber("DB_PORT", 5432),
      DB_NAME: getEnv("DB_NAME", "db-example"),
      DB_USER: getEnv("DB_USER", "postgres"),
      DB_PASSWORD: getEnv("DB_PASSWORD", ""),
      DB_SSL: getEnv("DB_SSL", "disable"),
      DB_URL: getDatabaseURL(),
      REDIS_URL: getEnv("REDIS_URL", "redis://127.0.0.1:6379"),
      REDIS_PORT: getEnvNumber("REDIS_PORT", 3679),
      WEBSOCKET_HOST: getEnv("WEBSOCKET_HOST", "http://127.0.0.1"),
      WEBSOCKET_PORT: getEnvNumber("WEBSOCKET_PORT", 3030),
      JWT_AT_SECRET: getEnv("JWT_AT_SECRET", "secret-key"),
      JWT_RT_SECRET: getEnv("JWT_RT_SECRET", "secret-key"),
      JWT_AT_EXPIRE: getEnv("JWT_AT_EXPIRE", "1h"),
      JWT_RT_EXPIRE: getEnv("JWT_RT_EXPIRE", "7d"),
    };

    if (!config.DB_PASSWORD && config.APP_ENV === "production") {
      throw new Error("DB_PASSWORD must be set in production environment");
    }

    return config;
  } catch (err) {
    console.error(`[ConfigError] ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

function getDatabaseURL(): string {
  const user = getEnv("DB_USER", "postgres");
  const password = encodeURIComponent(getEnv("DB_PASSWORD", ""));
  const host = getEnv("DB_HOST", "localhost");
  const port = getEnv("DB_PORT", "5432");
  const name = getEnv("DB_NAME", "db-example");
  const ssl = getEnv("DB_SSL", "disable");
  return `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=${ssl}`;
}

function getEnv(key: string, defValue: string): string {
  const val = process.env[key];
  return val ?? defValue;
}

function getEnvNumber(key: string, defValue: number): number {
  const val = process.env[key];
  if (!val) return defValue;

  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    console.warn(
      `Env ${key} is not a valid number, using default: ${defValue}`,
    );
    return defValue;
  }
  return parsed;
}

export const cfg = loadConfig();
