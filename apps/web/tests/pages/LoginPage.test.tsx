import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "../../src/pages/LoginPage";
import { renderWithProviders } from "../test-utils";

describe("LoginPage", () => {
  it("renders login form", () => {
    renderWithProviders(<LoginPage />);

    // en locale: "Welcome back"
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("submits login form successfully", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign In"));

    expect(login).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("shows error message on login failure", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error("Invalid credentials"));

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials",
      );
    });
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveLogin!: () => void;
    const login = vi.fn(() => new Promise<void>((r) => (resolveLogin = r)));

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign In"));

    // en locale: "Signing in…"
    expect(screen.getByText("Signing in…")).toBeInTheDocument();

    resolveLogin();
    await waitFor(() => {
      expect(screen.queryByText("Signing in…")).not.toBeInTheDocument();
    });
  });

  it("has a link to register page", () => {
    renderWithProviders(<LoginPage />);

    // en locale: "Create one"
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });
});
