import { db } from '../db';
import { driversTable, routesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export const deleteDriver = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the driver exists
    const existingDriver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, input.id))
      .execute();

    if (existingDriver.length === 0) {
      throw new Error(`Driver with id ${input.id} not found`);
    }

    // Check if the driver has any associated routes
    const routeCount = await db.select({ count: count() })
      .from(routesTable)
      .where(eq(routesTable.driver_id, input.id))
      .execute();

    if (routeCount[0].count > 0) {
      throw new Error(`Cannot delete driver with id ${input.id} because they have associated routes`);
    }

    // Delete the driver
    const result = await db.delete(driversTable)
      .where(eq(driversTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Driver deletion failed:', error);
    throw error;
  }
};