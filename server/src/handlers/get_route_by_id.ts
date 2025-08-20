import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type GetByIdInput, type RouteWithDriver } from '../schema';
import { eq } from 'drizzle-orm';

export const getRouteById = async (input: GetByIdInput): Promise<RouteWithDriver | null> => {
  try {
    // Query route with driver information using JOIN
    const results = await db.select()
      .from(routesTable)
      .innerJoin(driversTable, eq(routesTable.driver_id, driversTable.id))
      .where(eq(routesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract route and driver data from joined result
    const result = results[0];
    const routeData = result.routes;
    const driverData = result.drivers;

    // Convert numeric fields back to numbers and construct the result
    return {
      id: routeData.id,
      driver_id: routeData.driver_id,
      origin: routeData.origin,
      destination: routeData.destination,
      distance: parseFloat(routeData.distance), // Convert numeric to number
      estimated_duration: routeData.estimated_duration,
      start_datetime: routeData.start_datetime,
      end_datetime: routeData.end_datetime,
      route_status: routeData.route_status,
      created_at: routeData.created_at,
      driver: {
        id: driverData.id,
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        license_number: driverData.license_number,
        vehicle_make: driverData.vehicle_make,
        vehicle_model: driverData.vehicle_model,
        vehicle_license_plate: driverData.vehicle_license_plate,
        availability_status: driverData.availability_status,
        created_at: driverData.created_at
      }
    };
  } catch (error) {
    console.error('Get route by ID failed:', error);
    throw error;
  }
};