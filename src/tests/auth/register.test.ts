import request from "supertest";
import app from "#/cmd/server/app";
import * as userRepo from "#/module/user/repository/repository";
import { db } from "#/bootstrap/database";
import * as bcrypt from "bcrypt";

jest.mock("#/module/user/repository/repository");
jest.mock("#/bootstrap/database", () => ({
  db: { transaction: jest.fn() },
}));
jest.mock("bcrypt");

const mockedUserRepo = jest.mocked(userRepo);
const mockedDb = jest.mocked(db);
const mockedBcrypt = jest.mocked(bcrypt);

const validBody = {
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "password123",
};

describe("Auth endpoint tests (/auth)", () => {
  describe("POST /auth/register", () => {
    beforeEach(() => {
      mockedDb.transaction.mockImplementation(((cb: any) => cb({})) as any);
      mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
    });

    it("registers a new user and returns 201", async () => {
      mockedUserRepo.findByEmailOrUsername.mockResolvedValue(null as any);
      mockedUserRepo.insert.mockResolvedValue({
        id: 1,
        uid: "uid-1",
        name: validBody.name,
        username: validBody.username,
        email: validBody.email,
        isActive: true,
      } as any);
      mockedUserRepo.insertUserRoleByCode.mockResolvedValue({ roleId: 1 });
      mockedUserRepo.findUserRoles.mockResolvedValue(["USR"]);

      const res = await request(app).post("/auth/register").send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(validBody.password, 10);
      expect(mockedUserRepo.insertUserRoleByCode).toHaveBeenCalledWith(
        1,
        "USR",
        {},
        expect.anything(),
      );
    });

    it("returns 409 when email already exists", async () => {
      mockedUserRepo.findByEmailOrUsername.mockResolvedValue({
        email: validBody.email,
        username: "someone-else",
      } as any);

      const res = await request(app).post("/auth/register").send(validBody);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.reason).toBe("Email already exists!");
      expect(mockedUserRepo.insert).not.toHaveBeenCalled();
    });

    it("returns 409 when username already exists", async () => {
      mockedUserRepo.findByEmailOrUsername.mockResolvedValue({
        email: "different@example.com",
        username: validBody.username,
      } as any);

      const res = await request(app).post("/auth/register").send(validBody);

      expect(res.status).toBe(409);
      expect(res.body.errors.reason).toBe("Username already exists!");
    });

    it.each([
      ["name", { ...validBody, name: undefined }],
      ["username", { ...validBody, username: undefined }],
      ["email", { ...validBody, email: undefined }],
      ["password", { ...validBody, password: undefined }],
    ])("returns 400 when %s is missing", async (field, body) => {
      const res = await request(app).post("/auth/register").send(body);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        res.body.errors.details.some((d: any) => d.field === field),
      ).toBe(true);
      expect(mockedUserRepo.findByEmailOrUsername).not.toHaveBeenCalled();
    });

    it("returns 400 when email is invalid", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validBody, email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(
        res.body.errors.details.some((d: any) => d.field === "email"),
      ).toBe(true);
    });

    it("returns 400 when password is shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validBody, password: "short" });

      expect(res.status).toBe(400);
      expect(
        res.body.errors.details.some((d: any) => d.field === "password"),
      ).toBe(true);
    });
  });
});
