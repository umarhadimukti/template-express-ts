import type { UserResponse } from "#/module/user/dto/dto";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<
        UserResponse,
        "id" | "uid" | "password" | "createdAt" | "updatedAt"
      >;
    }
  }
}
