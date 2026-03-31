import { describe, it, expect, beforeEach } from "vitest";

import type { User } from "@flashcard-app/shared-types";
import { RegisterUseCase } from "../../src/usecases/RegisterUseCase";
import { LoginUseCase } from "../../src/usecases/LoginUseCase";
import type {
  IUserRepository,
  IRefreshTokenRepository,
} from "../../src/domain/repositories/index";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../src/shared/errors";

// ─── In-Memory Mock Repos ────────────────────────────────────────────────────

function createMockUserRepo(): IUserRepository {
  const users: User[] = [];
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
  };
}

function createMockRefreshTokenRepo(): IRefreshTokenRepository {
  const tokens: Array<{
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
  }> = [];
  return {
    async create(data) {
      tokens.push(data);
      return data;
    },
    async findByToken(token: string) {
      return tokens.find((t) => t.token === token) ?? null;
    },
    async deleteByToken(token: string) {
      const idx = tokens.findIndex((t) => t.token === token);
      if (idx >= 0) {
        tokens.splice(idx, 1);
        return true;
      }
      return false;
    },
    async revokeByToken(token: string) {
      const t = tokens.find((t) => t.token === token);
      if (t) return true;
      return false;
    },
    async deleteAllByUserId(userId: string) {
      const filtered = tokens.filter((t) => t.userId !== userId);
      tokens.length = 0;
      tokens.push(...filtered);
    },
  };
}

// ─── Register Use Case ──────────────────────────────────────────────────────

describe("RegisterUseCase", () => {
  let useCase: RegisterUseCase;
  let userRepo: IUserRepository;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    const refreshTokenRepo = createMockRefreshTokenRepo();
    useCase = new RegisterUseCase(
      userRepo,
      refreshTokenRepo,
      "test-jwt-secret",
    );
  });

  it("should register a new user successfully", async () => {
    const result = await useCase.execute({
      email: "test@example.com",
      name: "Test User",
      password: "SecurePass123!",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.user.name).toBe("Test User");
    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe("string");
    // passwordHash should NOT be in the response
    expect(
      (result.user as Record<string, unknown>)["passwordHash"],
    ).toBeUndefined();
  });

  it("should throw ConflictError when email already exists", async () => {
    await useCase.execute({
      email: "test@example.com",
      name: "Test User",
      password: "SecurePass123!",
    });

    await expect(
      useCase.execute({
        email: "test@example.com",
        name: "Another User",
        password: "AnotherPass123!",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ValidationError for invalid email", async () => {
    await expect(
      useCase.execute({
        email: "not-an-email",
        name: "Test User",
        password: "SecurePass123!",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError for short password", async () => {
    await expect(
      useCase.execute({
        email: "test@example.com",
        name: "Test User",
        password: "12",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError for empty name", async () => {
    await expect(
      useCase.execute({
        email: "test@example.com",
        name: "",
        password: "SecurePass123!",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── Login Use Case ─────────────────────────────────────────────────────────

describe("LoginUseCase", () => {
  let loginUseCase: LoginUseCase;
  let registerUseCase: RegisterUseCase;
  let userRepo: IUserRepository;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    const refreshTokenRepo = createMockRefreshTokenRepo();
    registerUseCase = new RegisterUseCase(
      userRepo,
      refreshTokenRepo,
      "test-jwt-secret",
    );
    loginUseCase = new LoginUseCase(
      userRepo,
      refreshTokenRepo,
      "test-jwt-secret",
    );
  });

  it("should login successfully with correct credentials", async () => {
    await registerUseCase.execute({
      email: "test@example.com",
      name: "Test User",
      password: "SecurePass123!",
    });

    const result = await loginUseCase.execute({
      email: "test@example.com",
      password: "SecurePass123!",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.accessToken).toBeDefined();
  });

  it("should throw UnauthorizedError for wrong password", async () => {
    await registerUseCase.execute({
      email: "test@example.com",
      name: "Test User",
      password: "SecurePass123!",
    });

    await expect(
      loginUseCase.execute({
        email: "test@example.com",
        password: "WrongPassword",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError for non-existent email", async () => {
    await expect(
      loginUseCase.execute({
        email: "nonexistent@example.com",
        password: "SomePassword",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
