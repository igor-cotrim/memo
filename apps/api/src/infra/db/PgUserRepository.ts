import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { User } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../shared/errors';
import * as schema from './schema';

export class PgUserRepository implements IUserRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    return rows[0] ?? null;
  }

  async create(user: User): Promise<User> {
    await this.db.insert(schema.users).values({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
    return user;
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'onboardingCompletedAt'>>,
  ): Promise<User> {
    const rows = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();

    if (!rows[0]) {
      throw new NotFoundError('User', id);
    }

    return rows[0];
  }
}
