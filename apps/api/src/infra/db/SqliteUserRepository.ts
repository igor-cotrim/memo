import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type { User } from "@flashcard-app/shared-types";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import * as schema from "./schema";

export class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<User | null> {
    const row = this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();
    return row ? this.toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .get();
    return row ? this.toUser(row) : null;
  }

  async create(user: User): Promise<User> {
    this.db
      .insert(schema.users)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      })
      .run();
    return user;
  }

  private toUser(row: typeof schema.users.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    };
  }
}
