import { db } from '../db';
import { driversTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Driver } from '../schema';

export const getDriverById = async (input: GetByIdInput): Promise<Driver | null> => {
  try {
    const results = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get driver by ID failed:', error);
    throw error;
  }
};