import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    // Return the created user
    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};