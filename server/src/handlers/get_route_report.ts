import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type RouteReportFilter, type RouteReportSummary } from '../schema';
import { eq, gte, lte, and, type SQL } from 'drizzle-orm';

export const getRouteReport = async (input: RouteReportFilter): Promise<RouteReportSummary> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.driver_id !== undefined) {
      conditions.push(eq(routesTable.driver_id, input.driver_id));
    }

    if (input.start_date !== undefined) {
      conditions.push(gte(routesTable.start_datetime, input.start_date));
    }

    if (input.end_date !== undefined) {
      conditions.push(lte(routesTable.start_datetime, input.end_date));
    }

    if (input.route_status !== undefined) {
      conditions.push(eq(routesTable.route_status, input.route_status));
    }

    // Build the query with driver information
    const baseQuery = db.select()
      .from(routesTable)
      .innerJoin(driversTable, eq(routesTable.driver_id, driversTable.id));

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // Process the joined results and calculate statistics
    let totalDistance = 0;
    let totalDuration = 0;
    let completedRoutes = 0;
    let pendingRoutes = 0;
    let inProgressRoutes = 0;
    let cancelledRoutes = 0;

    const routes = results.map(result => {
      const routeData = result.routes;
      const driverData = result.drivers;

      // Convert numeric fields
      const distance = parseFloat(routeData.distance);
      totalDistance += distance;
      totalDuration += routeData.estimated_duration;

      // Count by status
      switch (routeData.route_status) {
        case 'completed':
          completedRoutes++;
          break;
        case 'pending':
          pendingRoutes++;
          break;
        case 'in_progress':
          inProgressRoutes++;
          break;
        case 'cancelled':
          cancelledRoutes++;
          break;
      }

      return {
        id: routeData.id,
        driver_id: routeData.driver_id,
        origin: routeData.origin,
        destination: routeData.destination,
        distance: distance,
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
    });

    return {
      total_routes: routes.length,
      completed_routes: completedRoutes,
      pending_routes: pendingRoutes,
      in_progress_routes: inProgressRoutes,
      cancelled_routes: cancelledRoutes,
      total_distance: totalDistance,
      total_duration: totalDuration,
      routes: routes
    };
  } catch (error) {
    console.error('Route report generation failed:', error);
    throw error;
  }
};