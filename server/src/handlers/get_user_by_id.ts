import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type User } from '../schema';

export const getUserById = async (input: GetByIdInput): Promise<User | null> => {
  try {
    // Query the user by ID
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Return null if user not found
    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) user found
    return result[0];
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw error;
  }
};