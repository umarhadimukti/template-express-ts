import express from "express";
import userRoutes from "#/module/user/routes/routes";

export function initRouterV1(app: express.Application) {
  const router = express.Router();

  router.use("/api/v1/user", userRoutes);
  // router.use("/example", exampleRoutes);

  app.use(router);
}