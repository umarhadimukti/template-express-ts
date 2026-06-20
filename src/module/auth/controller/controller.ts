import type { Request, Response, NextFunction } from "express";
import * as authService from "../service/service";
import { successResponse } from "#/pkg/utils/response/response";
import { httpStatus } from "#/pkg/utils/constant/constant";
import { authMessage } from "#/module/auth/constant/constant";

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req?.user!;
    successResponse(res, httpStatus.OK, authMessage.USER_SUCCESS, user);
  } catch (err) {
    next(err);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await authService.register(req.body, req);
    successResponse(res, httpStatus.CREATED, authMessage.REGISTER_SUCCESS);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.login(req.body);
    successResponse(res, httpStatus.OK, authMessage.LOGIN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req?.user?.id!;
    await authService.logout(userId);
    successResponse(res, httpStatus.NO_CONTENT, authMessage.LOGOUT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
  } catch (err) {
    next(err);
  }
}
