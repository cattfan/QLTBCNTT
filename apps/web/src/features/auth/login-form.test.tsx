import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginRequest } from "./auth-api";
import { getAuthToken } from "./auth-storage";
import { LoginForm } from "./login-form";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("./auth-api", () => ({
  loginRequest: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockReplace.mockReset();
    vi.mocked(loginRequest).mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("hiển thị lỗi Zod khi dữ liệu không hợp lệ", async () => {
    const user = userEvent.setup();

    render(createElement(LoginForm));

    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      screen.getByText("Tài khoản phải là một email hợp lệ."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mật khẩu phải có ít nhất 6 ký tự."),
    ).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it("lưu token vào localStorage và điều hướng sau khi đăng nhập thành công", async () => {
    const user = userEvent.setup();

    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "jwt-token",
      account: {
        id: "local-admin",
        email: "admin@example.com",
        name: "Administrator",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    render(createElement(LoginForm));

    await user.type(
      screen.getByRole("textbox", { name: "Tài khoản" }),
      "admin@example.com",
    );
    await user.type(screen.getByLabelText("Mật khẩu"), "admin123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(getAuthToken()).toBe("jwt-token");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("hiển thị lỗi backend khi sai thông tin đăng nhập", async () => {
    const user = userEvent.setup();

    vi.mocked(loginRequest).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
      },
    });

    render(createElement(LoginForm));

    await user.type(
      screen.getByRole("textbox", { name: "Tài khoản" }),
      "admin@example.com",
    );
    await user.type(screen.getByLabelText("Mật khẩu"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Tài khoản hoặc mật khẩu không đúng.",
      );
    });
    expect(getAuthToken()).toBeNull();
  });
});
