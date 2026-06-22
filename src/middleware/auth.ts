import { cfg } from "#/config/config";
import type { UserResponse } from "#/module/user/dto/dto";
import { httpStatus } from "#/pkg/utils/constant/constant";
import { Unauthorized } from "#/pkg/utils/error/error";
import { errorResponse } from "#/pkg/utils/response/response";
import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const PREFIX_BEARER = "Bearer";

export async function authenticated() {
  return function (req: Request, res: Response, next: NextFunction) {
    let token: string | undefined = undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith(PREFIX_BEARER)) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies) {
      token = req.cookies?.token as string | undefined;
    }

    if (!token) {
      errorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
        new Unauthorized("Token not found"),
      );
      return;
    }

    try {
      const decoded = jwt.verify(token, cfg.JWT_AT_SECRET) as Omit<UserResponse, "id" | "uid" | "password" | "createdAt" | "updatedAt">;
      req.user = decoded;
      next();
    } catch (err) {
      errorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
        new Unauthorized("Invalid or expired token"),
      );
    }
  };
}
