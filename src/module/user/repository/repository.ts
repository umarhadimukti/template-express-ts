import { db } from "#/bootstrap/database";
import { usersTable } from "#/../drizzle/schema/user";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import type {
  CreateUserRequest,
  ListUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../dto/dto";
import type { Request } from "express";
import { userRoleTable } from "#/../drizzle/schema/user_role";
import { rolesTable } from "#/../drizzle/schema/role";
import { InternalServer } from "#/pkg/utils/error/error";
import { PaginationResponse } from "#/pkg/types/pagination";
import {
  helperCreateAudit,
  helperLogQueryError,
  helperSoftDeleteAudit,
  helperUpdateAudit,
} from "#/pkg/utils/helper/common_helper";

type InsertUserData = Omit<CreateUserRequest, "password"> & {
  uid: string;
  passwordHash: string;
};

const userColumns = {
  id: usersTable.id,
  uid: usersTable.uid,
  name: usersTable.name,
  username: usersTable.username,
  email: usersTable.email,
  isActive: usersTable.isActive,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

export async function findAll(
  req: ListUserRequest,
): Promise<PaginationResponse<UserResponse[]>> {
  const offset = (req.page - 1) * req.limit;
  const search = req.keyword
    ? or(
        ilike(usersTable.name, `%${req.keyword}%`),
        ilike(usersTable.username, `%${req.keyword}%`),
        ilike(usersTable.email, `%${req.keyword}%`),
      )
    : undefined;
  const where = and(isNull(usersTable.deletedAt), search);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select(userColumns)
      .from(usersTable)
      .where(where)
      .limit(req.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(where),
  ]);

  return {
    items: rows as UserResponse[],
    total: count,
    total_page: Math.ceil(count / req.limit),
    page: req.page,
    limit: req.limit,
  };
}

export async function findByUID(uid: string) {
  const rows = await db
    .select({
      id: usersTable.id,
      uid: usersTable.uid,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      createdBy: usersTable.createdBy,
    })
    .from(usersTable)
    .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)));
  return rows[0] ?? null;
}

export async function findById(id: number): Promise<UserResponse> {
  const rows = await db
    .select(userColumns)
    .from(usersTable)
    .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)));
  return rows[0] ?? null;
}

export async function findByUsername(
  username: string,
): Promise<UserResponse & { password: string }> {
  const rows = await db
    .select({ ...userColumns, password: usersTable.passwordHash })
    .from(usersTable)
    .where(
      and(eq(usersTable.username, username), isNull(usersTable.deletedAt)),
    );
  return rows[0] ?? null;
}

export async function findByEmail(email: string) {
  const rows = await db
    .select(userColumns)
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return rows[0] ?? null;
}

export async function findByEmailOrUsername(
  email: string,
  username: string,
): Promise<UserResponse> {
  const rows = await db
    .select(userColumns)
    .from(usersTable)
    .where(or(eq(usersTable.email, email), eq(usersTable.username, username)));
  return rows[0] ?? null;
}

export async function insert(
  data: InsertUserData,
  tx: any = db,
  req: Request,
): Promise<UserResponse> {
  try {
    const rows = await tx
      .insert(usersTable)
      .values({ ...data, ...helperCreateAudit(req) })
      .returning(userColumns);
    return rows[0] as Omit<UserResponse, "roles">;
  } catch (err) {
    helperLogQueryError("USER_INSERT", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function update(
  uid: string,
  data: UpdateUserRequest,
  req: Request,
): Promise<UserResponse | null> {
  try {
    const rows = await db
      .update(usersTable)
      .set({ ...data, ...helperUpdateAudit(req) })
      .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)))
      .returning(userColumns);
    return (rows[0] as Omit<UserResponse, "roles">) ?? null;
  } catch (err) {
    helperLogQueryError("USER_UPDATE", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function softDelete(uid: string, req: Request): Promise<void> {
  try {
    await db
      .update(usersTable)
      .set({ ...helperSoftDeleteAudit(req) })
      .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)));
  } catch (err) {
    helperLogQueryError("USER_SOFTDELETE", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function findUserRoles(
  userId: number,
  tx: any = db,
): Promise<string[]> {
  const userRoles = await tx
    .select({ roleId: userRoleTable.roleId, roleName: rolesTable.name })
    .from(userRoleTable)
    .innerJoin(
      rolesTable,
      and(eq(userRoleTable.id, rolesTable.id), eq(rolesTable.isActive, true)),
    )
    .where(
      and(
        eq(userRoleTable.userId, userId),
        eq(userRoleTable.isActive, true),
        isNull(userRoleTable.deletedAt),
        isNull(rolesTable.deletedAt),
      ),
    );
  return userRoles.length > 0
    ? userRoles.map(
        (role: { roleId: number; roleName: string }) => role.roleName!,
      )
    : [];
}

export async function checkExistingRoleByCode(
  roleCode: string,
  tx: any = db,
): Promise<{ id: number } | null> {
  const role = await tx
    .select({ id: rolesTable.id })
    .from(rolesTable)
    .where(
      and(
        eq(rolesTable.code, roleCode),
        eq(rolesTable.isActive, true),
        isNull(rolesTable.deletedAt),
      ),
    )
    .limit(1);
  return role[0] ?? null;
}

export async function insertUserRoleByCode(
  userId: number,
  roleCode: string,
  tx: any = db,
  req: Request,
): Promise<{ roleId: number } | null> {
  try {
    const existingRole = await checkExistingRoleByCode(roleCode, tx);
    let userRole: { roleId: number } | null = null;
    if (existingRole) {
      const insertedUserRole = await tx
        .insert(userRoleTable)
        .values({
          uid: crypto.randomUUID().toString(),
          userId,
          roleId: existingRole.id,
          ...helperCreateAudit(req),
        })
        .returning({ roleId: userRoleTable.roleId });
      userRole = insertedUserRole[0];
    }
    return userRole;
  } catch (err) {
    helperLogQueryError("USER_INSERT_USER_ROLE_BY_CODE", err);
    throw new InternalServer("Failed to execute query");
  }
}
