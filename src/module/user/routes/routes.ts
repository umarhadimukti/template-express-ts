import express from "express";
import * as ctrl from "@/module/user/controller/controller";

const router = express.Router();

router.get("/list", ctrl.listUser);
router.get("/:uid", ctrl.getUser);
router.put("/:uid", ctrl.updateUser);
router.post("/", ctrl.createUser);
router.delete("/:uid", ctrl.deleteUser);

export default router;
