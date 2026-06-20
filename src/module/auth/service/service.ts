import type { LoginRequest, RegisterRequest } from "../dto/dto";
// import * as authRepo from "#/module/auth/repository/repository";
import * as userRepo from "#/module/user/repository/repository";
import { Conflict } from "#/pkg/utils/error/error";
import * as bcrypt from "bcrypt";
import { roleCode } from "../constant/constant";
import { UserResponse } from "#/module/user/dto/dto";
import { db } from "#/bootstrap/database";
import type { Request } from "express";

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
      await userRepo.insertUserRoleByCode(insertedUser.id, roleCode.USER, tx, req);
      const userRoles = await userRepo.findUserRoles(insertedUser.id, tx);

      const result: UserResponse = {
        ...insertedUser,
        roles: userRoles.map((r) => r.roleName!),
      };
      return result;
    });
    return response;
  } catch (err) {
    console.error(`register service error: ${err}`);
    throw err;
  }
}

export async function login(req: LoginRequest) {
  try {
  } catch (err) {
    console.error(`login service error: ${err}`);
    throw err;
  }
}

export async function logout(userId: number) {}

export async function refresh() {}
