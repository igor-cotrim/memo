import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

import type { PublicUser } from "@flashcard-app/shared-types";
import * as api from "../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .getMe()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      const result = await api.register({ email, name, password });
      setUser(result.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: PublicUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
