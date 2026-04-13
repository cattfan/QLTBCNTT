import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "./auth-api";
import { getAuthToken, setAuthToken } from "./auth-storage";
import { DashboardShell } from "./dashboard-shell";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("./auth-api", () => ({
  fetchCurrentUser: vi.fn(),
}));

describe("DashboardShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockReplace.mockReset();
    vi.mocked(fetchCurrentUser).mockReset();
  });

  it("điều hướng về login khi không có token", async () => {
    render(createElement(DashboardShell));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("hiển thị thông tin người dùng khi token hợp lệ", async () => {
    setAuthToken("jwt-token");

    vi.mocked(fetchCurrentUser).mockResolvedValue({
      account: {
        id: "local-admin",
        email: "admin@example.com",
        name: "Administrator",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    render(createElement(DashboardShell));

    expect(
      screen.getByText("Đang xác minh token..."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Administrator")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
  });

  it("xóa token và quay lại login khi bấm đăng xuất", async () => {
    const user = userEvent.setup();

    setAuthToken("jwt-token");

    vi.mocked(fetchCurrentUser).mockResolvedValue({
      account: {
        id: "local-admin",
        email: "admin@example.com",
        name: "Administrator",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    render(createElement(DashboardShell));

    await waitFor(() => {
      expect(screen.getByText("Administrator")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    expect(getAuthToken()).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
