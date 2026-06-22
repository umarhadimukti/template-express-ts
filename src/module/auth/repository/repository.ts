import { db } from "#/bootstrap/database";
import { InternalServer } from "#/pkg/utils/error/error";
import {
  helperCreateAudit,
  helperLogQueryError,
  helperSoftDeleteAudit,
} from "#/pkg/utils/helper/common_helper";
import { and, eq, isNull } from "drizzle-orm";
import { refreshTokensTable } from "#/../drizzle/schema/refresh_token";
import { SaveTokenData } from "../dto/dto";
import type { Request } from "express";

const refreshTokenColumns = {
  id: refreshTokensTable.id,
  uid: refreshTokensTable.uid,
  token: refreshTokensTable.token,
  isUsed: refreshTokensTable.isUsed,
  expiredAt: refreshTokensTable.expiredAt,
  createdAt: refreshTokensTable.createdAt,
};

export async function findToken(oldToken: string) {
  const token = await db
    .select({
      id: refreshTokensTable.id,
      userId: refreshTokensTable.userId,
      token: refreshTokensTable.token,
      isUsed: refreshTokensTable.isUsed,
      expiredAt: refreshTokensTable.expiredAt,
    })
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.token, oldToken),
        isNull(refreshTokensTable.deletedAt),
      ),
    )
    .limit(1);
  return token[0] ?? null;
}

export async function saveToken(
  data: SaveTokenData,
  req: Request,
  tx: any = db,
) {
  try {
    const savedToken = await tx
      .insert(refreshTokensTable)
      .values({
        uid: crypto.randomUUID().toString(),
        ...data,
        ...helperCreateAudit(req),
      })
      .returning(refreshTokenColumns);
    return savedToken;
  } catch (err) {
    helperLogQueryError("AUTH_SAVE_TOKEN", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function markTokenAsUsed(id: number, tx: any = db) {
  try {
    await tx
      .update(refreshTokensTable)
      .set({ isUsed: true })
      .where(eq(refreshTokensTable.id, id));
  } catch (err) {
    helperLogQueryError("AUTH_MARK_TOKEN_AS_USED", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function deleteToken(token: string, req: Request) {
  try {
    await db
      .update(refreshTokensTable)
      .set({ ...helperSoftDeleteAudit(req) })
      .where(
        and(
          eq(refreshTokensTable.token, token),
          isNull(refreshTokensTable.deletedAt),
        ),
      );
  } catch (err) {
    helperLogQueryError("AUTH_DELETE_TOKEN", err);
    throw new InternalServer("Failed to execute query");
  }
}

export async function revokeAllUserTokens(userId: number, req: Request) {
  try {
    await db
      .update(refreshTokensTable)
      .set({ ...helperSoftDeleteAudit(req) })
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          isNull(refreshTokensTable.deletedAt),
        ),
      );
  } catch (err) {
    helperLogQueryError("AUTH_REVOKE_ALL_USER_TOKENS", err);
    throw new InternalServer("Failed to execute query");
  }
}
