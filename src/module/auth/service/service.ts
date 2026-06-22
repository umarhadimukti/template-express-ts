import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
} from "../dto/dto";
// import * as authRepo from "#/module/auth/repository/repository";
import * as userRepo from "#/module/user/repository/repository";
import * as authRepo from "#/module/auth/repository/repository";
import {
  BadRequest,
  Conflict,
  NotFound,
  Unauthorized,
} from "#/pkg/utils/error/error";
import * as bcrypt from "bcrypt";
import { roleCode } from "../constant/constant";
import { UserResponse } from "#/module/user/dto/dto";
import { db } from "#/bootstrap/database";
import type { Request } from "express";
import {
  buildAccessToken,
  buildRefreshToken,
  getTokenExpiry,
} from "#/pkg/utils/helper/jwt";
import { logger } from "#/pkg/logger/logger";

export async function register(bodyReq: RegisterRequest, req: Request) {
  try {
    const existingUser = await userRepo.findByEmailOrUsername(
      bodyReq.email,
      bodyReq.username,
    );
    if (existingUser) {
      if (existingUser.email === bodyReq.email) {
        throw new Conflict("Email already exists!");
      }
      if (existingUser.username === bodyReq.username) {
        throw new Conflict("Username already exists!");
      }
    }

    const hashedPassword = await bcrypt.hash(bodyReq.password, 10);
    const randUid = crypto.randomUUID().toString();
    const data = {
      uid: randUid,
      name: bodyReq.name,
      username: bodyReq.username,
      email: bodyReq.email,
      passwordHash: hashedPassword,
    };

    const response = await db.transaction(async (tx) => {
      const insertedUser = await userRepo.insert(data, tx, req);
      await userRepo.insertUserRoleByCode(
        insertedUser.id,
        roleCode.USER,
        tx,
        req,
      );
      const userRoles = await userRepo.findUserRoles(insertedUser.id, tx);

      const result: Omit<UserResponse, "password"> = {
        ...insertedUser,
        roles: userRoles,
      };
      return result;
    });
    return response;
  } catch (err) {
    console.error(`register service error: ${err}`);
    throw err;
  }
}

export async function login(
  bodyReq: LoginRequest,
  req: Request,
): Promise<LoginResponse> {
  try {
    const user = await userRepo.findByUsername(bodyReq.username);
    if (!user) {
      throw new Unauthorized("Invalid username or password");
    }
    const isValidPassword = await bcrypt.compare(
      bodyReq.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new Unauthorized("Invalid username or password");
    }
    const inactiveUser = !user.isActive;
    if (inactiveUser) {
      throw new BadRequest(
        "User account is inactive, please contact our team.",
      );
    }

    const roles = await userRepo.findUserRoles(user.id);
    const accessToken = buildAccessToken({ ...user, roles });
    const refreshToken = buildRefreshToken({ ...user, roles });

    await authRepo.saveToken(
      {
        userId: user.id,
        token: refreshToken,
        isUsed: false,
        expiredAt: getTokenExpiry(refreshToken),
      },
      req,
    );

    return { accessToken, refreshToken };
  } catch (err) {
    console.error(`login service error: ${err}`);
    throw err;
  }
}

export async function logout(
  username: string,
  oldRefreshToken: string | undefined,
  req: Request,
) {
  try {
    const user = await userRepo.findByUsername(username);
    if (!user) {
      throw new NotFound("User not found");
    }
    if (oldRefreshToken) {
      await authRepo.deleteToken(oldRefreshToken, req);
    }
  } catch (err) {
    console.error(`logout service error: ${err}`);
    throw err;
  }
}

export async function refresh(
  oldRefreshToken: string,
  req: Request,
): Promise<RefreshTokenResponse> {
  try {
    const savedToken = await authRepo.findToken(oldRefreshToken);
    if (!savedToken) {
      throw new Unauthorized("Invalid refresh token");
    }

    if (savedToken.isUsed) {
      await authRepo.revokeAllUserTokens(savedToken.userId, req);
      throw new Unauthorized(
        "Refresh token reuse detected, all sessions revoked",
      );
    }

    if (savedToken.expiredAt && savedToken.expiredAt.getTime() < Date.now()) {
      await authRepo.deleteToken(oldRefreshToken, req);
      throw new Unauthorized("Refresh token expired");
    }

    const user = await userRepo.findById(savedToken.userId);
    if (!user) {
      throw new NotFound("User not found");
    }

    const roles = await userRepo.findUserRoles(user.id);
    const accessToken = buildAccessToken({ ...user, roles });
    const newRefreshToken = buildRefreshToken({ ...user, roles });

    await db.transaction(async (tx) => {
      await authRepo.markTokenAsUsed(savedToken.id, tx);
      await authRepo.saveToken(
        {
          userId: user.id,
          token: newRefreshToken,
          isUsed: false,
          expiredAt: getTokenExpiry(newRefreshToken),
        },
        req,
        tx,
      );
    });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    logger.error(`refresh token service error: ${err}`);
    throw err;
  }
}
