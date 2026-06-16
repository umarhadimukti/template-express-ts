import http from "node:http";
import app from "#/cmd/server/app";
import { closeDatabase, initDatabase } from "#/bootstrap/database";
import { closeRedis, initRedis } from "#/bootstrap/redis";
import { closeWebsocket, initWebSocket } from "#/bootstrap/websocket";
import { loadConfig } from "#/config/config";
import { logger } from "#/pkg/logger/logger";

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Rejection:", reason);
  process.exit(1);
});

async function main() {
  const cfg = loadConfig();

  initDatabase(cfg);
  logger.info("[SUCCESS]: Initialized Database");

  initRedis(cfg);
  logger.info("[SUCCESS]: Initialized Redis");

  const server = http.createServer(app);

  const wsPort = cfg.WEBSOCKET_PORT || 3030;
  initWebSocket(wsPort);
  logger.info("[SUCCESS]: Initialized WebSocket server");

  server.listen(cfg.APP_PORT, () => {
    logger.info(`🚀 [RUNNING]: Server listening on port ${cfg.APP_PORT}`);
  });

  server.on("error", (err) => {
    if ("code" in err && (err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      logger.error(
        `[ERROR]: Port ${cfg.APP_PORT} is already in use. Please choose another port or stop the process using it.`,
      );
    } else {
      logger.error(`[ERROR]: Failed to start server: ${err}`);
    }
    process.exit(1);
  });

  let isShuttingDown = false;
  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[${signal}] Received. Starting graceful shutdown...`);

    server.close(async () => {
      try {
        await Promise.all([closeDatabase(), closeRedis(), closeWebsocket()]);
        logger.info("✅ All resources cleaned up. Exiting.");
        process.exit(0);
      } catch (err) {
        logger.error(`⚠️ Error during cleanup: ${err}`);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error(
        "🔥 Could not close connections in time, forcefully shutting down",
      );
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(`[ERROR]: Failed to start server: ${err}`);
  process.exit(1);
});
