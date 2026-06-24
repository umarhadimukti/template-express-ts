import { httpStatus } from "#/pkg/utils/constant/constant";
import { Forbidden, Unauthorized } from "#/pkg/utils/error/error";
import { errorResponse } from "#/pkg/utils/response/response";
import * as jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { UserResponse } from "#/module/user/dto/dto";
import { cfg } from "#/config/config";

const PREFIX_BEARER = "Bearer";

export function authenticated() {
  return (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined = undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith(PREFIX_BEARER)) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies) {
      token = req.cookies?.access_token as string | undefined;
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
      const decoded = jwt.verify(token, cfg.JWT_AT_SECRET) as Omit<
        UserResponse,
        "id" | "uid" | "password" | "createdAt" | "updatedAt"
      >;
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

export function authorizeRoles(roles: string[]) {
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
