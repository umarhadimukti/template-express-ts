import express from "express";
import * as ctrl from "#/module/user/controller/controller";
import { authenticated } from "#/middleware/auth";
import { validate } from "#/middleware/validate";
import { Rules } from "#/pkg/validator/rules";

const router = express.Router();

router.use(authenticated);

router.get("/list", ctrl.listUser);
router.get("/:uid", ctrl.getUser);
router.put("/:uid", ctrl.updateUser);
router.post(
  "/",
  validate({
    body: {
      name: [Rules.required(), Rules.min(1)],
      username: [Rules.required(), Rules.min(3)],
      email: [Rules.required(), Rules.email()],
      password: [Rules.required(), Rules.min(8)],
    },
  }),
  ctrl.createUser,
);
router.delete("/:uid", ctrl.deleteUser);

export default router;
