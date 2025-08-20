import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type RouteWithDriver } from '../schema';
import { eq } from 'drizzle-orm';

export const getRoutes = async (): Promise<RouteWithDriver[]> => {
  try {
    // Query all routes with driver information using JOIN
    const results = await db.select()
      .from(routesTable)
      .innerJoin(driversTable, eq(routesTable.driver_id, driversTable.id))
      .execute();

    // Map results to RouteWithDriver format with proper numeric conversions
    return results.map(result => ({
      id: result.routes.id,
      driver_id: result.routes.driver_id,
      origin: result.routes.origin,
      destination: result.routes.destination,
      distance: parseFloat(result.routes.distance), // Convert numeric string to number
      estimated_duration: result.routes.estimated_duration,
      start_datetime: result.routes.start_datetime,
      end_datetime: result.routes.end_datetime,
      route_status: result.routes.route_status,
      created_at: result.routes.created_at,
      driver: {
        id: result.drivers.id,
        name: result.drivers.name,
        email: result.drivers.email,
        phone: result.drivers.phone,
        license_number: result.drivers.license_number,
        vehicle_make: result.drivers.vehicle_make,
        vehicle_model: result.drivers.vehicle_model,
        vehicle_license_plate: result.drivers.vehicle_license_plate,
        availability_status: result.drivers.availability_status,
        created_at: result.drivers.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get routes:', error);
    throw error;
  }
};