import { cfg } from "#/config/config";
import type { UserResponse } from "#/module/user/dto/dto";
import * as jwt from "jsonwebtoken";

export function buildAccessToken(user: UserResponse & { roles: string[] }) {
  const jwtPayload: Omit<
    UserResponse,
    "id" | "uid" | "password" | "createdAt" | "updatedAt"
  > = {
    name: user.name,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    roles: user.roles,
  };
  const token = jwt.sign(jwtPayload, cfg.JWT_AT_SECRET, {
    expiresIn: cfg.JWT_AT_EXPIRE,
  } as jwt.SignOptions);
  return token;
}

export function buildRefreshToken(user: UserResponse & { roles: string[] }) {
  const jwtPayload: Omit<
    UserResponse,
    "id" | "uid" | "password" | "createdAt" | "updatedAt"
  > = {
    name: user.name,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    roles: user.roles,
  };
  const token = jwt.sign(jwtPayload, cfg.JWT_RT_SECRET, {
    expiresIn: cfg.JWT_RT_EXPIRE,
  } as jwt.SignOptions);
  return token;
}

export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error("Token does not contain an expiration claim");
  }
  return new Date(decoded.exp * 1000);
}
