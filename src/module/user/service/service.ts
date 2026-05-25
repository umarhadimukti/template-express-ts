import crypto from "node:crypto";
import { BadRequest, Conflict, NotFound } from "@/pkg/utils/error/error";
import { userError } from "../constant/error";
import type { CreateUserRequest, ListUserRequest, UpdateUserRequest } from "../dto/dto";
import * as repo from "../repository/repository";

export async function listUser(req: ListUserRequest) {
  return repo.findAll(req);
}

export async function getUser(uid: string) {
  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);

  const { passwordHash: _, ...publicFields } = user;
  return publicFields;
}

export async function createUser(req: CreateUserRequest) {
  if (!req.name) throw new BadRequest("name is required");
  if (!req.username) throw new BadRequest("username is required");
  if (!req.email) throw new BadRequest("email is required");
  if (!req.password) throw new BadRequest("password is required");

  const [existingUsername, existingEmail] = await Promise.all([
    repo.findByUsername(req.username),
    repo.findByEmail(req.email),
  ]);
  if (existingUsername) throw new Conflict(userError.USERNAME_TAKEN);
  if (existingEmail) throw new Conflict(userError.EMAIL_TAKEN);

  const passwordHash = await hashPassword(req.password);
  const uid = crypto.randomUUID();

  return repo.insert({ uid, name: req.name, username: req.username, email: req.email, passwordHash });
}

export async function updateUser(uid: string, req: UpdateUserRequest) {
  if (!req.name && !req.username && !req.email) {
    throw new BadRequest("At least one field (name, username, email) is required");
  }

  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);

  if (req.username && req.username !== user.username) {
    const existing = await repo.findByUsername(req.username);
    if (existing) throw new Conflict(userError.USERNAME_TAKEN);
  }
  if (req.email && req.email !== user.email) {
    const existing = await repo.findByEmail(req.email);
    if (existing) throw new Conflict(userError.EMAIL_TAKEN);
  }

  return repo.update(uid, req);
}

export async function deleteUser(uid: string) {
  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);
  await repo.softDelete(uid);
}

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}
