import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { LOGIN_ROUTE } from "./auth-routes";
import { clearAuthToken, getAuthToken } from "./auth-storage";

type UnauthorizedHandler = () => void;

interface AuthInternalRequestConfig<D = unknown>
  extends InternalAxiosRequestConfig<D> {
  skipAuthRedirect?: boolean;
}

export interface AuthRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  skipAuthRedirect?: boolean;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1005";

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAuthToken();

    if (!token) {
      return config;
    }

    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return {
      ...config,
      headers,
    };
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const config = error.config as AuthInternalRequestConfig | undefined;

      if (error.response?.status === 401 && !config?.skipAuthRedirect) {
        clearAuthToken();

        if (unauthorizedHandler) {
          unauthorizedHandler();
        } else if (
          typeof window !== "undefined" &&
          window.location.pathname !== LOGIN_ROUTE
        ) {
          window.location.assign(LOGIN_ROUTE);
        }
      }
    }

    return Promise.reject(error);
  },
);

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}
