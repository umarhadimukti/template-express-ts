import cookieParser from "cookie-parser";
import express from "express";
import type { Request, Response } from "express";
import { httpLogger } from "@/middleware/logger/logger.middleware";
import { errorHandler, notFoundHandler } from "@/middleware/middleware";
import {
  corsMiddleware,
  rateLimitMiddleware,
  securityMiddleware,
} from "@/middleware/security/security.middleware";
import { initRouterV1 } from "@/router/router";

const app = express();

app.set("trust proxy", 1);

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(httpLogger);

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    env: process.env.APP_ENV ?? "local",
    timestamp: new Date().toISOString(),
  });
});

initRouterV1(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
