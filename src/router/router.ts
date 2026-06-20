import express from "express";
import userRoutes from "#/module/user/routes/routes";
import authRoutes from "#/module/auth/routes/routes";

const BASE_V1 = "/api/v1";

export function initRouterV1(app: express.Application) {
  const router = express.Router();

  router.use("/auth", authRoutes);
  router.use(`${BASE_V1}/users`, userRoutes);

  app.use(router);
}
