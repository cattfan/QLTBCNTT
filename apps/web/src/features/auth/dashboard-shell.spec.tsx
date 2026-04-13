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

  it("redirects to login when there is no token", async () => {
    render(createElement(DashboardShell));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("shows hello after a valid session is loaded", async () => {
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

    expect(screen.getByText("Checking token...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
  });

  it("clears token and goes back to login on logout", async () => {
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
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(getAuthToken()).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
