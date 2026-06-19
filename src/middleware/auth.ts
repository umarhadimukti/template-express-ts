import { httpStatus } from "#/pkg/utils/constant/constant";
import { Forbidden, Unauthorized } from "#/pkg/utils/error/error";
import { errorResponse } from "#/pkg/utils/response/response";
import * as jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { loadConfig } from "#/config/config";
import { UserResponse } from "#/module/user/dto/dto";

const cfg = loadConfig();

export async function auth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token as string | undefined;
    if (!token) {
      errorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
        new Unauthorized("Unauthorized"),
      );
      return;
    }
    try {
      const payload = jwt.verify(token, cfg.JWT_AT_SECRET) as Omit<
        UserResponse,
        "createdAt" | "updatedAt"
      >;
      req.user = payload;
      next();
    } catch (err) {
      errorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        "Invalid or expired token",
        new Unauthorized("Invalid or expired token"),
      );
    }
  };
}

export async function authorizeRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      errorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        "Invalid or expired token",
        new Unauthorized("Invalid or expired token"),
      );
      return;
    }
    for (const role of req.user.roles!) {
      if (!roles.includes(role)) {
        errorResponse(
          res,
          httpStatus.UNAUTHORIZED,
          "Forbidden",
          new Forbidden("Forbidden"),
        );
        return;
      }
    }
    next();
  };
}
