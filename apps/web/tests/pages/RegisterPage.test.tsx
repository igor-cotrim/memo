import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RegisterPage from "../../src/pages/RegisterPage";
import { renderWithProviders } from "../test-utils";

describe("RegisterPage", () => {
  it("renders registration form", () => {
    renderWithProviders(<RegisterPage />);

    // en locale: "Create account"
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByText("Create Account", { selector: "button" }),
    ).toBeInTheDocument();
  });

  it("submits register form successfully", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "SecurePass123!");
    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    expect(register).toHaveBeenCalledWith(
      "john@example.com",
      "John Doe",
      "SecurePass123!",
    );
  });

  it("shows error message on registration failure", async () => {
    const user = userEvent.setup();
    const register = vi
      .fn()
      .mockRejectedValue(new Error("Email already exists"));

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "SecurePass123!");
    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email already exists",
      );
    });
  });

  it("has a link to login page", () => {
    renderWithProviders(<RegisterPage />);

    // en locale: "Sign in"
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    const register = vi.fn();

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    const alerts = screen.getAllByRole("alert");
    expect(alerts.some((a) => a.textContent === "This field is required")).toBe(
      true,
    );
    expect(register).not.toHaveBeenCalled();
  });

  it("shows email validation error for invalid email", async () => {
    const user = userEvent.setup();
    const register = vi.fn();

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "bad-email");
    await user.type(screen.getByLabelText("Password"), "123456");
    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows minLength validation error for short password", async () => {
    const user = userEvent.setup();
    const register = vi.fn();

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "abc");
    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    expect(
      screen.getByText("Must be at least 6 characters"),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveRegister!: () => void;
    const register = vi.fn(
      () => new Promise<void>((r) => (resolveRegister = r)),
    );

    renderWithProviders(<RegisterPage />, { auth: { register } });

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "SecurePass123!");
    await user.click(
      screen.getByText("Create Account", { selector: "button" }),
    );

    // en locale: "Creating account…"
    expect(screen.getByText("Creating account…")).toBeInTheDocument();

    resolveRegister();
    await waitFor(() => {
      expect(screen.queryByText("Creating account…")).not.toBeInTheDocument();
    });
  });
});
