import type { LoginRequest, RegisterRequest } from "../dto/dto";
// import * as authRepo from "#/module/auth/repository/repository";
import * as userRepo from "#/module/user/repository/repository";
import { Conflict } from "#/pkg/utils/error/error";
import * as bcrypt from "bcrypt";
import { roleCode } from "../constant/constant";
import { UserResponse } from "#/module/user/dto/dto";

export async function register(req: RegisterRequest) {
  try {
    const isEmailExists = await userRepo.findByEmail(req.email);
    if (isEmailExists) {
      throw new Conflict("Email already exists!");
    }
    const isUsernameExists = await userRepo.findByUsername(req.username);
    if (isUsernameExists) {
      throw new Conflict("Username already exists!");
    }

    const hashedPassword = await bcrypt.hash(req.password, 10);
    const randUid = crypto.randomUUID().toString();
    const data = {
      uid: randUid,
      name: req.name,
      username: req.username,
      email: req.email,
      passwordHash: hashedPassword,
    };
    const insertedUser = await userRepo.insert(data);
    await userRepo.insertUserRoleByCode(insertedUser.id, roleCode.USER);
    const userRoles = await userRepo.findUserRoles(insertedUser.id);
    
    const resp: UserResponse = {
      ...insertedUser,
      roles: userRoles.map((r) => r.roleName!),
    };
    return resp;
  } catch (err) {
    throw err;
  }
}

export async function login(req: LoginRequest) {}

export async function logout(userId: number) {}

export async function refresh() {}
