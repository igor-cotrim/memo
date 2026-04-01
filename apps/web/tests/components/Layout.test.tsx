import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Layout from "../../src/components/Layout";
import { renderWithProviders } from "../test-utils";

describe("Layout", () => {
  it("shows navigation links when user is logged in", () => {
    renderWithProviders(<Layout />, {
      auth: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "John",
          createdAt: new Date().toISOString(),
        },
        isLoading: false,
      },
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Decks")).toBeInTheDocument();
    expect(screen.getByLabelText("User menu")).toBeInTheDocument();
  });

  it("shows only locale toggle when user is not logged in", () => {
    renderWithProviders(<Layout />, {
      auth: { user: null, isLoading: false },
    });

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Decks")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("User menu")).not.toBeInTheDocument();
    // Locale toggle should be there
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("renders FlashMind logo link", () => {
    renderWithProviders(<Layout />, {
      auth: { user: null, isLoading: false },
    });

    expect(screen.getByText("FlashMind")).toBeInTheDocument();
  });

  it("calls logout and navigates on sign out", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<Layout />, {
      auth: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "John",
          createdAt: new Date().toISOString(),
        },
        isLoading: false,
        logout,
      },
    });

    await user.click(screen.getByLabelText("User menu"));
    await user.click(screen.getByText("Sign Out"));
    expect(logout).toHaveBeenCalled();
  });

  it("toggles locale when locale button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Layout />, {
      auth: { user: null, isLoading: false },
    });

    expect(screen.getByText("EN")).toBeInTheDocument();
    await user.click(screen.getByText("EN"));
    expect(screen.getByText("PT")).toBeInTheDocument();
  });

  it("renders skip link", () => {
    renderWithProviders(<Layout />, {
      auth: { user: null, isLoading: false },
    });

    expect(screen.getByText("Skip to content")).toBeInTheDocument();
  });
});
