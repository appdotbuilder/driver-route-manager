import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type UpdateRouteInput, type Route } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRoute = async (input: UpdateRouteInput): Promise<Route> => {
  try {
    // If driver_id is being updated, verify the new driver exists
    if (input.driver_id !== undefined) {
      const driver = await db.select()
        .from(driversTable)
        .where(eq(driversTable.id, input.driver_id))
        .execute();

      if (driver.length === 0) {
        throw new Error(`Driver with id ${input.driver_id} not found`);
      }
    }

    // Prepare update values, converting numeric fields to strings
    const updateValues: any = {};
    
    if (input.driver_id !== undefined) updateValues.driver_id = input.driver_id;
    if (input.origin !== undefined) updateValues.origin = input.origin;
    if (input.destination !== undefined) updateValues.destination = input.destination;
    if (input.distance !== undefined) updateValues.distance = input.distance.toString();
    if (input.estimated_duration !== undefined) updateValues.estimated_duration = input.estimated_duration;
    if (input.start_datetime !== undefined) updateValues.start_datetime = input.start_datetime;
    if (input.end_datetime !== undefined) updateValues.end_datetime = input.end_datetime;
    if (input.route_status !== undefined) updateValues.route_status = input.route_status;

    // Update the route record
    const result = await db.update(routesTable)
      .set(updateValues)
      .where(eq(routesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Route with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const route = result[0];
    return {
      ...route,
      distance: parseFloat(route.distance)
    };
  } catch (error) {
    console.error('Route update failed:', error);
    throw error;
  }
};