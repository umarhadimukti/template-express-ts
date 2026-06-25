import request from "supertest";
import * as jwt from "jsonwebtoken";
import app from "#/cmd/server/app";
import * as userRepo from "#/module/user/repository/repository";
import * as authRepo from "#/module/auth/repository/repository";
import * as bcrypt from "bcrypt";
import { cfg } from "#/config/config";

jest.mock("#/module/user/repository/repository");
jest.mock("#/module/auth/repository/repository");
jest.mock("bcrypt");

const mockedUserRepo = jest.mocked(userRepo);
const mockedAuthRepo = jest.mocked(authRepo);
const mockedBcrypt = jest.mocked(bcrypt);

const credentials = { username: "johndoe", password: "password123" };

const storedUser = {
  id: 1,
  uid: "uid-1",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "hashed-password",
  isActive: true,
  createdAt: new Date(),
  updatedAt: null,
};

describe("POST /auth/login", () => {
  beforeEach(() => {
    mockedAuthRepo.saveToken.mockResolvedValue([] as any);
    mockedUserRepo.findUserRoles.mockResolvedValue(["USR"]);
  });

  it("logs in with valid credentials and sets auth cookies", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue(storedUser as any);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged in");

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const accessCookie = cookies.find((c) => c.startsWith("access_token="));
    const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    const accessToken = accessCookie!.split(";")[0].split("=")[1];
    const decoded = jwt.verify(accessToken, cfg.JWT_AT_SECRET) as jwt.JwtPayload;
    expect(decoded.username).toBe(storedUser.username);
    expect(decoded.roles).toEqual(["USR"]);

    expect(mockedAuthRepo.saveToken).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when the username does not exist", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue(null as any);

    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.reason).toBe("Invalid username or password");
    expect(mockedBcrypt.compare).not.toHaveBeenCalled();
  });

  it("returns 401 when the password is incorrect", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue(storedUser as any);
    mockedBcrypt.compare.mockResolvedValue(false as never);

    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.errors.reason).toBe("Invalid username or password");
    expect(mockedAuthRepo.saveToken).not.toHaveBeenCalled();
  });

  it("returns 400 when the user account is inactive", async () => {
    mockedUserRepo.findByUsername.mockResolvedValue({
      ...storedUser,
      isActive: false,
    } as any);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(400);
    expect(res.body.errors.reason).toBe(
      "User account is inactive, please contact our team.",
    );
  });

  it.each([
    ["username", { password: credentials.password }],
    ["password", { username: credentials.username }],
  ])("returns 400 when %s is missing", async (field, body) => {
    const res = await request(app).post("/auth/login").send(body);

    expect(res.status).toBe(400);
    expect(
      res.body.errors.details.some((d: any) => d.field === field),
    ).toBe(true);
    expect(mockedUserRepo.findByUsername).not.toHaveBeenCalled();
  });
});
