import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";

import type { PublicUser } from "@flashcard-app/shared-types";
import * as api from "../services/api";

interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Try to refresh to validate session
      api
        .getDecks()
        .then(() => {
          // Token is valid, but we don't have user info yet
          // Decode from token (simple approach)
          try {
            const payload = JSON.parse(atob(token.split(".")[1]!));
            setUser({ id: payload.userId, email: "", name: "", createdAt: "" });
          } catch {
            localStorage.removeItem("accessToken");
          }
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
