import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type CreateRouteInput, type Route } from '../schema';
import { eq } from 'drizzle-orm';

export const createRoute = async (input: CreateRouteInput): Promise<Route> => {
  try {
    // First verify that the driver exists and is available
    const driver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, input.driver_id))
      .execute();

    if (driver.length === 0) {
      throw new Error(`Driver with id ${input.driver_id} not found`);
    }

    if (driver[0].availability_status !== 'available') {
      throw new Error(`Driver with id ${input.driver_id} is not available`);
    }

    // Insert route record
    const result = await db.insert(routesTable)
      .values({
        driver_id: input.driver_id,
        origin: input.origin,
        destination: input.destination,
        distance: input.distance.toString(), // Convert number to string for numeric column
        estimated_duration: input.estimated_duration,
        start_datetime: input.start_datetime,
        end_datetime: input.end_datetime || null,
        route_status: input.route_status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const route = result[0];
    return {
      ...route,
      distance: parseFloat(route.distance) // Convert string back to number
    };
  } catch (error) {
    console.error('Route creation failed:', error);
    throw error;
  }
};