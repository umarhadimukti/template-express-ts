import request from "supertest";
import * as jwt from "jsonwebtoken";
import app from "#/cmd/server/app";
import { cfg } from "#/config/config";

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

describe("GET /auth/user", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/auth/user");

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Token not found");
  });

  it("returns 401 when the token is invalid", async () => {
    const res = await request(app)
      .get("/auth/user")
      .set("Authorization", "Bearer not-a-valid-token");

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Invalid or expired token");
  });

  it("returns the current user via a Bearer token", async () => {
    const res = await request(app)
      .get("/auth/user")
      .set("Authorization", `Bearer ${buildAccessToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User fetched successfully");
    expect(res.body.data).toMatchObject({
      username: tokenPayload.username,
      email: tokenPayload.email,
      roles: tokenPayload.roles,
    });
  });

  it("returns the current user via the access_token cookie", async () => {
    const res = await request(app)
      .get("/auth/user")
      .set("Cookie", [`access_token=${buildAccessToken()}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(tokenPayload.username);
  });
});
