import request from "supertest";
import app from "#/cmd/server/app";
import * as userRepo from "#/module/user/repository/repository";
import * as authRepo from "#/module/auth/repository/repository";
import { db } from "#/bootstrap/database";

jest.mock("#/module/user/repository/repository");
jest.mock("#/module/auth/repository/repository");
jest.mock("#/bootstrap/database", () => ({
  db: { transaction: jest.fn() },
}));

const mockedUserRepo = jest.mocked(userRepo);
const mockedAuthRepo = jest.mocked(authRepo);
const mockedDb = jest.mocked(db);

const OLD_REFRESH_TOKEN = "old-refresh-token";

const storedUser = {
  id: 1,
  uid: "uid-1",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  isActive: true,
  createdAt: new Date(),
  updatedAt: null,
};

function withRefreshCookie() {
  return request(app)
    .post("/auth/refresh")
    .set("Cookie", [`refresh_token=${OLD_REFRESH_TOKEN}`]);
}

describe("POST /auth/refresh", () => {
  beforeEach(() => {
    mockedDb.transaction.mockImplementation(((cb: any) => cb({})) as any);
  });

  it("returns 401 when no refresh_token cookie is sent", async () => {
    const res = await request(app).post("/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Refresh token not found");
    expect(mockedAuthRepo.findToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the refresh token is unknown", async () => {
    mockedAuthRepo.findToken.mockResolvedValue(null as any);

    const res = await withRefreshCookie();

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Invalid refresh token");
  });

  it("revokes all sessions and returns 401 on token reuse", async () => {
    mockedAuthRepo.findToken.mockResolvedValue({
      id: 10,
      userId: storedUser.id,
      token: OLD_REFRESH_TOKEN,
      isUsed: true,
      expiredAt: new Date(Date.now() + 60_000),
    } as any);

    const res = await withRefreshCookie();

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe(
      "Refresh token reuse detected, all sessions revoked",
    );
    expect(mockedAuthRepo.revokeAllUserTokens).toHaveBeenCalledWith(
      storedUser.id,
      expect.anything(),
    );
  });

  it("deletes the token and returns 401 when it has expired", async () => {
    mockedAuthRepo.findToken.mockResolvedValue({
      id: 10,
      userId: storedUser.id,
      token: OLD_REFRESH_TOKEN,
      isUsed: false,
      expiredAt: new Date(Date.now() - 60_000),
    } as any);

    const res = await withRefreshCookie();

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Refresh token expired");
    expect(mockedAuthRepo.deleteToken).toHaveBeenCalledWith(
      OLD_REFRESH_TOKEN,
      expect.anything(),
    );
  });

  it("returns 404 when the token's owner no longer exists", async () => {
    mockedAuthRepo.findToken.mockResolvedValue({
      id: 10,
      userId: storedUser.id,
      token: OLD_REFRESH_TOKEN,
      isUsed: false,
      expiredAt: new Date(Date.now() + 60_000),
    } as any);
    mockedUserRepo.findById.mockResolvedValue(null as any);

    const res = await withRefreshCookie();

    expect(res.status).toBe(404);
    expect(res.body.errors.reason).toBe("User not found");
  });

  it("rotates the refresh token and sets new cookies on success", async () => {
    mockedAuthRepo.findToken.mockResolvedValue({
      id: 10,
      userId: storedUser.id,
      token: OLD_REFRESH_TOKEN,
      isUsed: false,
      expiredAt: new Date(Date.now() + 60_000),
    } as any);
    mockedUserRepo.findById.mockResolvedValue(storedUser as any);
    mockedUserRepo.findUserRoles.mockResolvedValue(["USR"]);
    mockedAuthRepo.markTokenAsUsed.mockResolvedValue(undefined);
    mockedAuthRepo.saveToken.mockResolvedValue([] as any);

    const res = await withRefreshCookie();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Token refreshed successfully");

    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("access_token="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refresh_token="))).toBe(true);
    expect(mockedAuthRepo.markTokenAsUsed).toHaveBeenCalledWith(10, {});
    expect(mockedAuthRepo.saveToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: storedUser.id, isUsed: false }),
      expect.anything(),
      {},
    );
  });
});
