import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable, routesTable } from '../db/schema';
import { type CreateDriverInput, type CreateRouteInput } from '../schema';
import { getRoutes } from '../handlers/get_routes';

// Test data
const testDriver: CreateDriverInput = {
  name: 'John Driver',
  email: 'john.driver@test.com',
  phone: '+1234567890',
  license_number: 'DL123456789',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC123',
  availability_status: 'available'
};

const testDriver2: CreateDriverInput = {
  name: 'Jane Driver',
  email: 'jane.driver@test.com',
  phone: '+0987654321',
  license_number: 'DL987654321',
  vehicle_make: 'Honda',
  vehicle_model: 'Civic',
  vehicle_license_plate: 'XYZ789',
  availability_status: 'unavailable'
};

describe('getRoutes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no routes exist', async () => {
    const result = await getRoutes();
    expect(result).toEqual([]);
  });

  it('should return all routes with driver information', async () => {
    // Create test drivers
    const driverResult1 = await db.insert(driversTable)
      .values({
        name: testDriver.name,
        email: testDriver.email,
        phone: testDriver.phone,
        license_number: testDriver.license_number,
        vehicle_make: testDriver.vehicle_make,
        vehicle_model: testDriver.vehicle_model,
        vehicle_license_plate: testDriver.vehicle_license_plate,
        availability_status: testDriver.availability_status
      })
      .returning()
      .execute();

    const driverResult2 = await db.insert(driversTable)
      .values({
        name: testDriver2.name,
        email: testDriver2.email,
        phone: testDriver2.phone,
        license_number: testDriver2.license_number,
        vehicle_make: testDriver2.vehicle_make,
        vehicle_model: testDriver2.vehicle_model,
        vehicle_license_plate: testDriver2.vehicle_license_plate,
        availability_status: testDriver2.availability_status
      })
      .returning()
      .execute();

    const driver1 = driverResult1[0];
    const driver2 = driverResult2[0];

    // Create test routes
    const testRoute1: CreateRouteInput = {
      driver_id: driver1.id,
      origin: 'City A',
      destination: 'City B',
      distance: 150.75,
      estimated_duration: 180,
      start_datetime: new Date('2024-01-15T09:00:00Z'),
      end_datetime: new Date('2024-01-15T12:00:00Z'),
      route_status: 'completed'
    };

    const testRoute2: CreateRouteInput = {
      driver_id: driver2.id,
      origin: 'City C',
      destination: 'City D',
      distance: 87.25,
      estimated_duration: 120,
      start_datetime: new Date('2024-01-16T10:00:00Z'),
      route_status: 'in_progress'
    };

    await db.insert(routesTable)
      .values([
        {
          driver_id: testRoute1.driver_id,
          origin: testRoute1.origin,
          destination: testRoute1.destination,
          distance: testRoute1.distance.toString(), // Convert to string for numeric column
          estimated_duration: testRoute1.estimated_duration,
          start_datetime: testRoute1.start_datetime,
          end_datetime: testRoute1.end_datetime,
          route_status: testRoute1.route_status
        },
        {
          driver_id: testRoute2.driver_id,
          origin: testRoute2.origin,
          destination: testRoute2.destination,
          distance: testRoute2.distance.toString(), // Convert to string for numeric column
          estimated_duration: testRoute2.estimated_duration,
          start_datetime: testRoute2.start_datetime,
          end_datetime: testRoute2.end_datetime,
          route_status: testRoute2.route_status
        }
      ])
      .execute();

    // Test the handler
    const result = await getRoutes();

    // Verify results
    expect(result).toHaveLength(2);

    // Find routes by origin for consistent testing
    const route1 = result.find(r => r.origin === 'City A');
    const route2 = result.find(r => r.origin === 'City C');

    expect(route1).toBeDefined();
    expect(route2).toBeDefined();

    // Verify route 1 data and numeric conversion
    expect(route1!.driver_id).toEqual(driver1.id);
    expect(route1!.origin).toEqual('City A');
    expect(route1!.destination).toEqual('City B');
    expect(route1!.distance).toEqual(150.75);
    expect(typeof route1!.distance).toBe('number'); // Verify numeric conversion
    expect(route1!.estimated_duration).toEqual(180);
    expect(route1!.start_datetime).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(route1!.end_datetime).toEqual(new Date('2024-01-15T12:00:00Z'));
    expect(route1!.route_status).toEqual('completed');
    expect(route1!.id).toBeDefined();
    expect(route1!.created_at).toBeInstanceOf(Date);

    // Verify driver information for route 1
    expect(route1!.driver).toBeDefined();
    expect(route1!.driver.id).toEqual(driver1.id);
    expect(route1!.driver.name).toEqual('John Driver');
    expect(route1!.driver.email).toEqual('john.driver@test.com');
    expect(route1!.driver.phone).toEqual('+1234567890');
    expect(route1!.driver.license_number).toEqual('DL123456789');
    expect(route1!.driver.vehicle_make).toEqual('Toyota');
    expect(route1!.driver.vehicle_model).toEqual('Camry');
    expect(route1!.driver.vehicle_license_plate).toEqual('ABC123');
    expect(route1!.driver.availability_status).toEqual('available');
    expect(route1!.driver.created_at).toBeInstanceOf(Date);

    // Verify route 2 data and numeric conversion
    expect(route2!.driver_id).toEqual(driver2.id);
    expect(route2!.origin).toEqual('City C');
    expect(route2!.destination).toEqual('City D');
    expect(route2!.distance).toEqual(87.25);
    expect(typeof route2!.distance).toBe('number'); // Verify numeric conversion
    expect(route2!.estimated_duration).toEqual(120);
    expect(route2!.start_datetime).toEqual(new Date('2024-01-16T10:00:00Z'));
    expect(route2!.end_datetime).toBeNull();
    expect(route2!.route_status).toEqual('in_progress');

    // Verify driver information for route 2
    expect(route2!.driver).toBeDefined();
    expect(route2!.driver.id).toEqual(driver2.id);
    expect(route2!.driver.name).toEqual('Jane Driver');
    expect(route2!.driver.availability_status).toEqual('unavailable');
  });

  it('should handle routes with different statuses correctly', async () => {
    // Create test driver
    const driverResult = await db.insert(driversTable)
      .values({
        name: testDriver.name,
        email: testDriver.email,
        phone: testDriver.phone,
        license_number: testDriver.license_number,
        vehicle_make: testDriver.vehicle_make,
        vehicle_model: testDriver.vehicle_model,
        vehicle_license_plate: testDriver.vehicle_license_plate,
        availability_status: testDriver.availability_status
      })
      .returning()
      .execute();

    const driver = driverResult[0];

    // Create routes with different statuses
    const routes = [
      {
        driver_id: driver.id,
        origin: 'Origin 1',
        destination: 'Destination 1',
        distance: '100.00',
        estimated_duration: 60,
        start_datetime: new Date(),
        route_status: 'pending' as const
      },
      {
        driver_id: driver.id,
        origin: 'Origin 2',
        destination: 'Destination 2',
        distance: '200.50',
        estimated_duration: 120,
        start_datetime: new Date(),
        route_status: 'in_progress' as const
      },
      {
        driver_id: driver.id,
        origin: 'Origin 3',
        destination: 'Destination 3',
        distance: '300.75',
        estimated_duration: 180,
        start_datetime: new Date(),
        end_datetime: new Date(),
        route_status: 'completed' as const
      },
      {
        driver_id: driver.id,
        origin: 'Origin 4',
        destination: 'Destination 4',
        distance: '50.25',
        estimated_duration: 30,
        start_datetime: new Date(),
        route_status: 'cancelled' as const
      }
    ];

    await db.insert(routesTable)
      .values(routes)
      .execute();

    // Test the handler
    const result = await getRoutes();

    // Verify all routes returned
    expect(result).toHaveLength(4);

    // Verify all status types are present
    const statuses = result.map(r => r.route_status).sort();
    expect(statuses).toEqual(['cancelled', 'completed', 'in_progress', 'pending']);

    // Verify numeric conversions for all routes
    result.forEach(route => {
      expect(typeof route.distance).toBe('number');
      expect(route.distance).toBeGreaterThan(0);
      expect(route.driver).toBeDefined();
      expect(route.driver.id).toEqual(driver.id);
    });
  });

  it('should handle decimal distances correctly', async () => {
    // Create test driver
    const driverResult = await db.insert(driversTable)
      .values({
        name: testDriver.name,
        email: testDriver.email,
        phone: testDriver.phone,
        license_number: testDriver.license_number,
        vehicle_make: testDriver.vehicle_make,
        vehicle_model: testDriver.vehicle_model,
        vehicle_license_plate: testDriver.vehicle_license_plate,
        availability_status: testDriver.availability_status
      })
      .returning()
      .execute();

    const driver = driverResult[0];

    // Create route with decimal distance (PostgreSQL numeric(10,2) has 2 decimal places)
    await db.insert(routesTable)
      .values({
        driver_id: driver.id,
        origin: 'Test Origin',
        destination: 'Test Destination',
        distance: '123.45', // Two decimal places to match numeric(10,2) precision
        estimated_duration: 90,
        start_datetime: new Date(),
        route_status: 'pending'
      })
      .execute();

    // Test the handler
    const result = await getRoutes();

    expect(result).toHaveLength(1);
    expect(result[0].distance).toEqual(123.45);
    expect(typeof result[0].distance).toBe('number');
  });
});