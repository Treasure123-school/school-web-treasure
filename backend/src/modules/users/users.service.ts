import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '../../../../shared/schema';
import { DATABASE_CONNECTION } from '../../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

  async findAll() {
    return this.db.select().from(users);
  }

  async findOne(id: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async update(id: string, updateData: any) {
    const result = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string) {
    await this.db.delete(users).where(eq(users.id, id));
    return { message: 'User deleted successfully' };
  }
}
