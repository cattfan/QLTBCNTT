import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, registerUnauthorizedHandler } from "./api-client";
import { getAuthToken, setAuthToken } from "./auth-storage";

describe("apiClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("tự động gắn bearer token vào request", async () => {
    setAuthToken("jwt-token");

    const adapter: AxiosAdapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    const response = await apiClient.get("/auth/me", { adapter });
    const headers = AxiosHeaders.from(response.config.headers);

    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("xóa token và kích hoạt redirect handler khi backend trả về 401", async () => {
    const onUnauthorized = vi.fn();
    const unregister = registerUnauthorizedHandler(onUnauthorized);

    setAuthToken("expired-token");

    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError(
        "Unauthorized",
        "401",
        config as InternalAxiosRequestConfig,
        undefined,
        {
          data: {},
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

    await expect(apiClient.get("/auth/me", { adapter })).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(getAuthToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    unregister();
  });
});
