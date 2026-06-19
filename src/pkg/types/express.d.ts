import type { UserResponse } from "#/module/user/dto/dto";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<UserResponse, "createdAt" | "updatedAt">;
    }
  }
}
