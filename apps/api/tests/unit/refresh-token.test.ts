import { describe, it, expect, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

import type { User } from "@flashcard-app/shared-types";
import { RefreshTokenUseCase } from "../../src/usecases/RefreshTokenUseCase";
import type { IUserRepository } from "../../src/domain/repositories/IUserRepository";
import type {
  IRefreshTokenRepository,
  RefreshTokenData,
} from "../../src/domain/repositories/IRefreshTokenRepository";
import { UnauthorizedError } from "../../src/shared/errors";

const JWT_SECRET = "test-jwt-secret";

function createMockUserRepo(users: User[] = []): IUserRepository {
  return {
    async findById(id: string) {
      return users.find((u) => u.id === id) ?? null;
    },
    async findByEmail(email: string) {
      return users.find((u) => u.email === email) ?? null;
    },
    async create(user: User) {
      users.push(user);
      return user;
    },
    async update(
      id: string,
      data: Partial<Pick<User, "name" | "passwordHash">>,
    ) {
      const user = users.find((u) => u.id === id);
      if (!user) throw new Error("Not found");
      Object.assign(user, data);
      return user;
    },
  };
}

function createMockRefreshTokenRepo(
  tokens: RefreshTokenData[] = [],
): IRefreshTokenRepository {
  return {
    async create(data: RefreshTokenData) {
      tokens.push(data);
      return data;
    },
    async findByToken(token: string) {
      return tokens.find((t) => t.token === token) ?? null;
    },
    async revokeByToken(token: string) {
      const t = tokens.find((t) => t.token === token);
      if (t) {
        t.revokedAt = new Date().toISOString();
        return true;
      }
      return false;
    },
    async deleteByToken(token: string) {
      const idx = tokens.findIndex((t) => t.token === token);
      if (idx >= 0) {
        tokens.splice(idx, 1);
        return true;
      }
      return false;
    },
    async deleteAllByUserId(userId: string) {
      const filtered = tokens.filter((t) => t.userId !== userId);
      tokens.length = 0;
      tokens.push(...filtered);
    },
  };
}

describe("RefreshTokenUseCase", () => {
  const testUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "$2b$10$hashvalue",
    createdAt: new Date().toISOString(),
    onboardingCompletedAt: null,
  };

  it("refreshes tokens successfully", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const existingToken: RefreshTokenData = {
      id: "rt-1",
      userId: "user-1",
      token: "valid-refresh-token",
      expiresAt: futureDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const refreshTokenRepo = createMockRefreshTokenRepo([existingToken]);
    const userRepo = createMockUserRepo([testUser]);
    const useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      JWT_SECRET,
    );

    const result = await useCase.execute("valid-refresh-token");

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe("string");
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe("valid-refresh-token");

    // Verify access token is valid JWT
    const decoded = jwt.verify(result.accessToken, JWT_SECRET) as {
      userId: string;
    };
    expect(decoded.userId).toBe("user-1");
  });

  it("throws UnauthorizedError for non-existent token", async () => {
    const refreshTokenRepo = createMockRefreshTokenRepo([]);
    const userRepo = createMockUserRepo([testUser]);
    const useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      JWT_SECRET,
    );

    await expect(useCase.execute("nonexistent-token")).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(useCase.execute("nonexistent-token")).rejects.toThrow(
      "Invalid refresh token",
    );
  });

  it("throws UnauthorizedError for expired token", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const expiredToken: RefreshTokenData = {
      id: "rt-1",
      userId: "user-1",
      token: "expired-token",
      expiresAt: pastDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const refreshTokenRepo = createMockRefreshTokenRepo([expiredToken]);
    const userRepo = createMockUserRepo([testUser]);
    const useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      JWT_SECRET,
    );

    await expect(useCase.execute("expired-token")).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof UnauthorizedError &&
        err.message === "Refresh token expired",
    );
  });

  it("throws and revokes all tokens on revoked token reuse", async () => {
    const revokedToken: RefreshTokenData = {
      id: "rt-1",
      userId: "user-1",
      token: "revoked-token",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      revokedAt: new Date().toISOString(),
    };

    const tokens = [revokedToken];
    const refreshTokenRepo = createMockRefreshTokenRepo(tokens);
    const userRepo = createMockUserRepo([testUser]);
    const useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      JWT_SECRET,
    );

    await expect(useCase.execute("revoked-token")).rejects.toThrow(
      "Suspicious activity detected",
    );
    // All tokens for the user should be deleted
    expect(tokens).toHaveLength(0);
  });

  it("throws UnauthorizedError when user is not found", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const token: RefreshTokenData = {
      id: "rt-1",
      userId: "deleted-user",
      token: "valid-token",
      expiresAt: futureDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const refreshTokenRepo = createMockRefreshTokenRepo([token]);
    const userRepo = createMockUserRepo([]); //  no users
    const useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      JWT_SECRET,
    );

    await expect(useCase.execute("valid-token")).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof UnauthorizedError && err.message === "User not found",
    );
  });
});
