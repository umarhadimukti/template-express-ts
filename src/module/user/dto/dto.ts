// Request DTOs

export interface ListUserRequest {
  page: number;
  limit: number;
  keyword: string;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
}

// Response DTOs

export interface UserResponse {
  id: number;
  uid: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  roles?: string[];
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date | null;
}
