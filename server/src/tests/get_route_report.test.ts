import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, driversTable, routesTable } from '../db/schema';
import { type RouteReportFilter } from '../schema';
import { getRouteReport } from '../handlers/get_route_report';

// Test data setup
const testDriver1 = {
  name: 'John Driver',
  email: 'john@example.com',
  phone: '555-0001',
  license_number: 'DL12345',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC123',
  availability_status: 'available' as const
};

const testDriver2 = {
  name: 'Jane Driver',
  email: 'jane@example.com',
  phone: '555-0002',
  license_number: 'DL67890',
  vehicle_make: 'Honda',
  vehicle_model: 'Civic',
  vehicle_license_plate: 'XYZ789',
  availability_status: 'available' as const
};

describe('getRouteReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let driver1Id: number;
  let driver2Id: number;

  beforeEach(async () => {
    // Create test drivers
    const [driver1, driver2] = await db.insert(driversTable)
      .values([testDriver1, testDriver2])
      .returning()
      .execute();

    driver1Id = driver1.id;
    driver2Id = driver2.id;

    // Create test routes with various statuses and dates
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const yesterdayDate = new Date('2024-01-14T10:00:00Z');
    const tomorrowDate = new Date('2024-01-16T10:00:00Z');

    await db.insert(routesTable).values([
      {
        driver_id: driver1Id,
        origin: 'Point A',
        destination: 'Point B',
        distance: '10.50',
        estimated_duration: 30,
        start_datetime: baseDate,
        end_datetime: null,
        route_status: 'completed'
      },
      {
        driver_id: driver1Id,
        origin: 'Point C',
        destination: 'Point D',
        distance: '15.75',
        estimated_duration: 45,
        start_datetime: baseDate,
        end_datetime: null,
        route_status: 'pending'
      },
      {
        driver_id: driver2Id,
        origin: 'Point E',
        destination: 'Point F',
        distance: '8.25',
        estimated_duration: 25,
        start_datetime: yesterdayDate,
        end_datetime: null,
        route_status: 'in_progress'
      },
      {
        driver_id: driver2Id,
        origin: 'Point G',
        destination: 'Point H',
        distance: '12.00',
        estimated_duration: 35,
        start_datetime: tomorrowDate,
        end_datetime: null,
        route_status: 'cancelled'
      }
    ]).execute();
  });

  it('should return all routes when no filters applied', async () => {
    const filter: RouteReportFilter = {};
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(4);
    expect(result.completed_routes).toEqual(1);
    expect(result.pending_routes).toEqual(1);
    expect(result.in_progress_routes).toEqual(1);
    expect(result.cancelled_routes).toEqual(1);
    expect(result.total_distance).toEqual(46.5); // 10.5 + 15.75 + 8.25 + 12.0
    expect(result.total_duration).toEqual(135); // 30 + 45 + 25 + 35
    expect(result.routes).toHaveLength(4);

    // Verify route structure includes driver information
    const firstRoute = result.routes[0];
    expect(firstRoute.driver).toBeDefined();
    expect(firstRoute.driver.name).toBeDefined();
    expect(firstRoute.driver.email).toBeDefined();
    expect(typeof firstRoute.distance).toEqual('number');
  });

  it('should filter routes by driver_id', async () => {
    const filter: RouteReportFilter = {
      driver_id: driver1Id
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(2);
    expect(result.completed_routes).toEqual(1);
    expect(result.pending_routes).toEqual(1);
    expect(result.in_progress_routes).toEqual(0);
    expect(result.cancelled_routes).toEqual(0);
    expect(result.total_distance).toEqual(26.25); // 10.5 + 15.75
    expect(result.total_duration).toEqual(75); // 30 + 45

    // Verify all routes belong to driver1
    result.routes.forEach(route => {
      expect(route.driver_id).toEqual(driver1Id);
      expect(route.driver.name).toEqual('John Driver');
    });
  });

  it('should filter routes by route_status', async () => {
    const filter: RouteReportFilter = {
      route_status: 'completed'
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(1);
    expect(result.completed_routes).toEqual(1);
    expect(result.pending_routes).toEqual(0);
    expect(result.in_progress_routes).toEqual(0);
    expect(result.cancelled_routes).toEqual(0);
    expect(result.total_distance).toEqual(10.5);
    expect(result.total_duration).toEqual(30);

    const route = result.routes[0];
    expect(route.route_status).toEqual('completed');
    expect(route.origin).toEqual('Point A');
    expect(route.destination).toEqual('Point B');
  });

  it('should filter routes by start_date', async () => {
    const filter: RouteReportFilter = {
      start_date: new Date('2024-01-15T00:00:00Z')
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(3); // Routes on or after 2024-01-15
    expect(result.total_distance).toEqual(38.25); // 10.5 + 15.75 + 12.0
    expect(result.total_duration).toEqual(110); // 30 + 45 + 35

    // Verify all routes are on or after the start date
    result.routes.forEach(route => {
      expect(route.start_datetime >= new Date('2024-01-15T00:00:00Z')).toBe(true);
    });
  });

  it('should filter routes by end_date', async () => {
    const filter: RouteReportFilter = {
      end_date: new Date('2024-01-15T23:59:59Z')
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(3); // Routes on or before 2024-01-15
    expect(result.total_distance).toEqual(34.5); // 10.5 + 15.75 + 8.25
    expect(result.total_duration).toEqual(100); // 30 + 45 + 25

    // Verify all routes are on or before the end date
    result.routes.forEach(route => {
      expect(route.start_datetime <= new Date('2024-01-15T23:59:59Z')).toBe(true);
    });
  });

  it('should filter routes by date range', async () => {
    const filter: RouteReportFilter = {
      start_date: new Date('2024-01-15T00:00:00Z'),
      end_date: new Date('2024-01-15T23:59:59Z')
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(2); // Only routes on 2024-01-15
    expect(result.completed_routes).toEqual(1);
    expect(result.pending_routes).toEqual(1);
    expect(result.total_distance).toEqual(26.25); // 10.5 + 15.75
    expect(result.total_duration).toEqual(75); // 30 + 45

    // Verify all routes are within the date range
    result.routes.forEach(route => {
      const routeDate = route.start_datetime;
      expect(routeDate >= new Date('2024-01-15T00:00:00Z')).toBe(true);
      expect(routeDate <= new Date('2024-01-15T23:59:59Z')).toBe(true);
    });
  });

  it('should apply multiple filters correctly', async () => {
    const filter: RouteReportFilter = {
      driver_id: driver1Id,
      route_status: 'completed'
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(1);
    expect(result.completed_routes).toEqual(1);
    expect(result.pending_routes).toEqual(0);
    expect(result.total_distance).toEqual(10.5);
    expect(result.total_duration).toEqual(30);

    const route = result.routes[0];
    expect(route.driver_id).toEqual(driver1Id);
    expect(route.route_status).toEqual('completed');
    expect(route.driver.name).toEqual('John Driver');
  });

  it('should return empty result when no routes match filters', async () => {
    const filter: RouteReportFilter = {
      driver_id: driver1Id,
      route_status: 'cancelled'
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(0);
    expect(result.completed_routes).toEqual(0);
    expect(result.pending_routes).toEqual(0);
    expect(result.in_progress_routes).toEqual(0);
    expect(result.cancelled_routes).toEqual(0);
    expect(result.total_distance).toEqual(0);
    expect(result.total_duration).toEqual(0);
    expect(result.routes).toHaveLength(0);
  });

  it('should handle non-existent driver_id gracefully', async () => {
    const filter: RouteReportFilter = {
      driver_id: 99999 // Non-existent driver ID
    };
    const result = await getRouteReport(filter);

    expect(result.total_routes).toEqual(0);
    expect(result.routes).toHaveLength(0);
  });

  it('should verify numeric conversions are correct', async () => {
    const filter: RouteReportFilter = {};
    const result = await getRouteReport(filter);

    expect(result.routes.length).toBeGreaterThan(0);
    
    // Verify all numeric fields are properly converted
    result.routes.forEach(route => {
      expect(typeof route.distance).toEqual('number');
      expect(typeof route.estimated_duration).toEqual('number');
      expect(typeof route.id).toEqual('number');
      expect(typeof route.driver_id).toEqual('number');
    });

    // Verify total distance is a number
    expect(typeof result.total_distance).toEqual('number');
    expect(typeof result.total_duration).toEqual('number');
  });
});