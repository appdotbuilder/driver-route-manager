import { db } from '../db';
import { driversTable } from '../db/schema';
import { type Driver } from '../schema';

export const getDrivers = async (): Promise<Driver[]> => {
  try {
    const results = await db.select()
      .from(driversTable)
      .execute();

    // Return results without transformation since driver table fields match schema
    // No numeric fields need conversion in drivers table
    return results;
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
    throw error;
  }
};