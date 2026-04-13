import type {
  AuthMeResponse,
  AuthSessionResponse,
  LoginRequest,
} from "@repo/shared";
import { apiClient, type AuthRequestConfig } from "./api-client";

export async function loginRequest(payload: LoginRequest) {
  const response = await apiClient.post<AuthSessionResponse>(
    "/v1/auth/login",
    payload,
    {
      skipAuthRedirect: true,
    } as AuthRequestConfig<LoginRequest>,
  );

  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get<AuthMeResponse>("/v1/auth/me");

  return response.data;
}
