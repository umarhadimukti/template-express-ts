import type { Request, Response, NextFunction } from "express";
import * as authService from "../service/service";
import { successResponse } from "#/pkg/utils/response/response";
import { httpStatus } from "#/pkg/utils/constant/constant";
import { authMessage, cookieMaxAge } from "#/module/auth/constant/constant";
import { cfg } from "#/config/config";
import { Unauthorized } from "#/pkg/utils/error/error";

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
    const result = await authService.login(req.body, req);
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: cfg.APP_ENV === "production",
      sameSite: "lax",
      maxAge: cookieMaxAge.ACCESS_TOKEN,
    });
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: cfg.APP_ENV === "production",
      sameSite: "lax",
      maxAge: cookieMaxAge.REFRESH_TOKEN,
    });
    successResponse(res, httpStatus.OK, authMessage.LOGIN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const oldRefreshToken = req.cookies?.refresh_token;
    await authService.logout(req?.user?.username!, oldRefreshToken, req);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    successResponse(res, httpStatus.NO_CONTENT, authMessage.LOGOUT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldRefreshToken = req.cookies?.refresh_token;
    if (!oldRefreshToken) {
      throw new Unauthorized("Refresh token not found");
    }
    const result = await authService.refresh(oldRefreshToken, req);

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: cfg.APP_ENV === "production",
      sameSite: "lax",
      maxAge: cookieMaxAge.REFRESH_TOKEN,
    });

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: cfg.APP_ENV === "production",
      sameSite: "lax",
      maxAge: cookieMaxAge.ACCESS_TOKEN,
    });

    successResponse(res, httpStatus.NO_CONTENT, authMessage.REFRESH_SUCCESS);
  } catch (err) {
    next(err);
  }
}
