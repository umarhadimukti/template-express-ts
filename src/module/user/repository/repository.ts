import { db } from "#/bootstrap/database";
import { usersTable } from "#/../drizzle/schema/user";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import type {
  CreateUserRequest,
  ListUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../dto/dto";
import { userRoleTable } from "../../../../drizzle/schema/user_role";
import { rolesTable } from "../../../../drizzle/schema/role";
import { InternalServer } from "#/pkg/utils/error/error";

type InsertUserData = Omit<CreateUserRequest, "password"> & {
  uid: string;
  passwordHash: string;
};

const publicColumns = {
  uid: usersTable.uid,
  name: usersTable.name,
  username: usersTable.username,
  email: usersTable.email,
  isActive: usersTable.isActive,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

export async function findAll(req: ListUserRequest) {
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
      .select(publicColumns)
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
    data: rows as UserResponse[],
    total: count,
    page: req.page,
    limit: req.limit,
  };
}

export async function findByUID(uid: string) {
  const rows = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)));
  return rows[0] ?? null;
}

export async function findByUsername(username: string) {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return rows[0] ?? null;
}

export async function findByEmail(email: string) {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return rows[0] ?? null;
}

export async function insert(data: InsertUserData): Promise<UserResponse> {
  try {
    const rows = await db
      .insert(usersTable)
      .values(data)
      .returning(publicColumns);
    return rows[0] as Omit<UserResponse, "roles">;
  } catch (err) {
    throw new InternalServer(`Failed to execute query: ${err}`);
  }
}

export async function update(
  uid: string,
  data: UpdateUserRequest,
): Promise<UserResponse | null> {
  const rows = await db
    .update(usersTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)))
    .returning(publicColumns);
  return (rows[0] as UserResponse) ?? null;
}

export async function softDelete(uid: string): Promise<void> {
  await db
    .update(usersTable)
    .set({ isActive: false, deletedAt: new Date() })
    .where(and(eq(usersTable.uid, uid), isNull(usersTable.deletedAt)));
}

export async function findUserRoles(
  userId: number,
): Promise<{ roleId: number; roleName: string | null }[]> {
  const userRoles = await db
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
  return userRoles || [];
}

export async function checkExistingRoleByCode(roleCode: string) {
  const role = await db
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

export async function insertUserRoleByCode(userId: number, roleCode: string) {
  try {
    const existingRole = await checkExistingRoleByCode(roleCode);
    let userRole = null;
    if (existingRole) {
      const insertedUserRole = await db
        .insert(userRoleTable)
        .values({
          uid: crypto.randomUUID().toString(),
          userId,
          roleId: existingRole.id,
        })
        .returning({ roleId: userRoleTable.roleId });
      userRole = insertedUserRole[0];
    }
    return userRole;
  } catch (err) {
    throw new InternalServer(`Failed to execute query: ${err}`);
  }
}
