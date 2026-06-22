export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SaveTokenData {
  userId: number;
  token: string;
  isUsed: boolean;
  expiredAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
