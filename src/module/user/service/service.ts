import crypto from "node:crypto";
import type { Request } from "express";
import { BadRequest, Conflict, NotFound } from "#/pkg/utils/error/error";
import { userError } from "../constant/error";
import type { CreateUserRequest, ListUserRequest, UpdateUserRequest } from "../dto/dto";
import * as repo from "../repository/repository";

export async function listUser(req: ListUserRequest) {
  return repo.findAll(req);
}

export async function getUser(uid: string) {
  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);

  return user;
}

export async function createUser(body: CreateUserRequest, req: Request) {
  if (!body.name) throw new BadRequest("name is required");
  if (!body.username) throw new BadRequest("username is required");
  if (!body.email) throw new BadRequest("email is required");
  if (!body.password) throw new BadRequest("password is required");

  const [existingUsername, existingEmail] = await Promise.all([
    repo.findByUsername(body.username),
    repo.findByEmail(body.email),
  ]);
  if (existingUsername) throw new Conflict(userError.USERNAME_TAKEN);
  if (existingEmail) throw new Conflict(userError.EMAIL_TAKEN);

  const passwordHash = await hashPassword(body.password);
  const uid = crypto.randomUUID();

  return repo.insert(
    { uid, name: body.name, username: body.username, email: body.email, passwordHash },
    undefined,
    req,
  );
}

export async function updateUser(uid: string, body: UpdateUserRequest, req: Request) {
  if (!body.name && !body.username && !body.email) {
    throw new BadRequest("At least one field (name, username, email) is required");
  }

  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);

  if (body.username && body.username !== user.username) {
    const existing = await repo.findByUsername(body.username);
    if (existing) throw new Conflict(userError.USERNAME_TAKEN);
  }
  if (body.email && body.email !== user.email) {
    const existing = await repo.findByEmail(body.email);
    if (existing) throw new Conflict(userError.EMAIL_TAKEN);
  }

  return repo.update(uid, body, req);
}

export async function deleteUser(uid: string, req: Request) {
  const user = await repo.findByUID(uid);
  if (!user) throw new NotFound(userError.NOT_FOUND);
  await repo.softDelete(uid, req);
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
