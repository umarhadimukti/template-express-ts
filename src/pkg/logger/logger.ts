import { loadConfig } from "@/config/config";
import pino from "pino";

const config = loadConfig();
const isProduction = config.APP_ENV === "production";

export const logger = pino({
  level: config.APP_LOG_LEVEL,
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // redact: menyembunyikan data sensitif agar tidak bocor ke log
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "req.body.token"],
    censor: "***",
  },
  base: {
    env: process.env.NODE_ENV,
  },
});
