import express from "express";
import * as ctrl from "#/module/auth/controller/controller";
import { validate } from "#/middleware/validate";
import { Rules } from "#/pkg/validator/rules";
import { authenticated } from "#/middleware/auth";

const router = express.Router();

router.post(
  "/login",
  validate({
    body: { username: [Rules.required()], password: [Rules.required()] },
  }),
  ctrl.login,
);
router.post(
  "/register",
  validate({
    body: {
      name: [Rules.required()],
      username: [Rules.required()],
      email: [Rules.required(), Rules.email()],
      password: [Rules.required(), Rules.min(8)],
    },
  }),
  ctrl.register,
);
router.post("/refresh", ctrl.refresh);

router.get("/user", authenticated(), ctrl.getCurrentUser);
router.post("/logout", authenticated(), ctrl.logout);

export default router;
