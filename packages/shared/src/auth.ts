export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  account: AuthAccount;
}

export interface AuthMeResponse {
  account: AuthAccount;
}
