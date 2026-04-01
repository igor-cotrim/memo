import { createContext } from "react";

import type { PublicUser } from "@flashcard-app/shared-types";

export interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: PublicUser) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
