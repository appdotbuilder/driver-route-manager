import { db } from '../db';
import { routesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export const deleteRoute = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the route exists
    const existingRoute = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, input.id))
      .execute();

    if (existingRoute.length === 0) {
      throw new Error(`Route with ID ${input.id} not found`);
    }

    // Business rule: Only allow deletion of routes that are pending or cancelled
    // In-progress and completed routes should be preserved for historical records
    const route = existingRoute[0];
    if (route.route_status === 'in_progress' || route.route_status === 'completed') {
      throw new Error(`Cannot delete route with status '${route.route_status}'. Only pending and cancelled routes can be deleted.`);
    }

    // Perform the deletion
    const result = await db.delete(routesTable)
      .where(eq(routesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Route deletion failed:', error);
    throw error;
  }
};