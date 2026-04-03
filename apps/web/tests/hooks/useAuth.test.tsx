import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { useAuth } from "../../src/hooks/useAuth";
import { AuthContext, type AuthContextType } from "../../src/hooks/authContext";

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used inside AuthProvider");
  });

  it("returns context values when inside AuthProvider", () => {
    const mockAuth: AuthContextType = {
      user: {
        id: "1",
        email: "a@b.com",
        name: "Test",
        createdAt: new Date().toISOString(),
        onboardingCompletedAt: null,
      },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    };

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.user).toEqual(mockAuth.user);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.register).toBe("function");
    expect(typeof result.current.logout).toBe("function");
  });
});
