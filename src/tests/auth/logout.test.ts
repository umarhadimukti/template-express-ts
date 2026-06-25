import request from "supertest";
import * as jwt from "jsonwebtoken";
import app from "#/cmd/server/app";
import * as userRepo from "#/module/user/repository/repository";
import * as authRepo from "#/module/auth/repository/repository";
import { cfg } from "#/config/config";

jest.mock("#/module/user/repository/repository");
jest.mock("#/module/auth/repository/repository");

const mockedUserRepo = jest.mocked(userRepo);
const mockedAuthRepo = jest.mocked(authRepo);

const tokenPayload = {
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  isActive: true,
  roles: ["USR"],
};

function buildAccessToken() {
  return jwt.sign(tokenPayload, cfg.JWT_AT_SECRET, { expiresIn: "1h" });
}

describe("POST /auth/logout", () => {
  it("returns 401 when no access token is provided", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(401);
    expect(mockedUserRepo.findByUsername).not.toHaveBeenCalled();
  });

  it("returns 401 when the access token is invalid", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", ["access_token=not-a-valid-token"]);

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Invalid or expired token");
  });

  it("logs out and clears auth cookies for an authenticated user", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue({
      id: 1,
      username: tokenPayload.username,
    } as any);
    mockedAuthRepo.deleteToken.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", [
        `access_token=${buildAccessToken()}`,
        "refresh_token=some-refresh-token",
      ]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");
    expect(mockedAuthRepo.deleteToken).toHaveBeenCalledWith(
      "some-refresh-token",
      expect.anything(),
    );

    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("access_token="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refresh_token="))).toBe(true);
  });

  it("returns 404 when the authenticated user no longer exists", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue(null as any);

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", [`access_token=${buildAccessToken()}`]);

    expect(res.status).toBe(404);
    expect(res.body.errors.reason).toBe("User not found");
  });
});
