import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export const deleteUser = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // First check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Delete the user
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};