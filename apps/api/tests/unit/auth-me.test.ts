import { describe, it, expect, beforeEach } from "vitest";

import type { User } from "@flashcard-app/shared-types";
import { AuthMeUseCase } from "../../src/usecases/AuthMeUseCase";
import type { IUserRepository } from "../../src/domain/repositories/IUserRepository";
import { UnauthorizedError } from "../../src/shared/errors";

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
    async update(id: string, data: Partial<Pick<User, "name" | "passwordHash">>) {
      const user = users.find((u) => u.id === id);
      if (!user) throw new Error("Not found");
      Object.assign(user, data);
      return user;
    },
  };
}

describe("AuthMeUseCase", () => {
  let useCase: AuthMeUseCase;

  const testUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "$2b$10$hashvalue",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    const userRepo = createMockUserRepo([testUser]);
    useCase = new AuthMeUseCase(userRepo);
  });

  it("returns public user data (without passwordHash)", async () => {
    const result = await useCase.execute("user-1");

    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.name).toBe("Test User");
    expect(
      (result.user as Record<string, unknown>)["passwordHash"],
    ).toBeUndefined();
  });

  it("throws UnauthorizedError when user does not exist", async () => {
    await expect(useCase.execute("nonexistent")).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(useCase.execute("nonexistent")).rejects.toThrow(
      "User not found",
    );
  });
});
