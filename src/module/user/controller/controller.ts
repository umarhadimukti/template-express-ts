import { httpStatus } from "@/pkg/utils/constant/constant";
import { successResponse } from "@/pkg/utils/response/response";
import type { NextFunction, Request, Response } from "express";
import { userMessage } from "../constant/message";
import type { CreateUserRequest, UpdateUserRequest } from "../dto/dto";
import * as userService from "../service/service";

export async function listUser(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const keyword = (req.query.keyword as string) ?? "";

    const result = await userService.listUser({ page, limit, keyword });
    successResponse(res, httpStatus.OK, userMessage.LIST, result);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = req.params.uid as string;
    const user = await userService.getUser(uid);
    successResponse(res, httpStatus.OK, userMessage.GET, user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateUserRequest;
    const user = await userService.createUser(body);
    successResponse(res, httpStatus.CREATED, userMessage.CREATED, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = req.params.uid as string;
    const body = req.body as UpdateUserRequest;
    const user = await userService.updateUser(uid, body);
    successResponse(res, httpStatus.OK, userMessage.UPDATED, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = req.params.uid as string;
    await userService.deleteUser(uid);
    successResponse(res, httpStatus.OK, userMessage.DELETED, null);
  } catch (err) {
    next(err);
  }
}
