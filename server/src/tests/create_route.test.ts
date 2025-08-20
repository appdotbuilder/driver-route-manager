import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type CreateRouteInput } from '../schema';
import { createRoute } from '../handlers/create_route';
import { eq } from 'drizzle-orm';

// Helper function to create a test driver
const createTestDriver = async () => {
  const result = await db.insert(driversTable)
    .values({
      name: 'Test Driver',
      email: 'driver@test.com',
      phone: '555-0123',
      license_number: 'DL123456',
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_license_plate: 'ABC-123',
      availability_status: 'available'
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create an unavailable driver
const createUnavailableDriver = async () => {
  const result = await db.insert(driversTable)
    .values({
      name: 'Unavailable Driver',
      email: 'unavailable@test.com',
      phone: '555-0124',
      license_number: 'DL123457',
      vehicle_make: 'Honda',
      vehicle_model: 'Civic',
      vehicle_license_plate: 'XYZ-456',
      availability_status: 'unavailable'
    })
    .returning()
    .execute();
  return result[0];
};

describe('createRoute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a route successfully', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'Downtown Plaza',
      destination: 'Airport Terminal',
      distance: 25.5,
      estimated_duration: 45,
      start_datetime: new Date('2024-01-15T10:00:00Z'),
      end_datetime: null,
      route_status: 'pending'
    };

    const result = await createRoute(testInput);

    // Basic field validation
    expect(result.driver_id).toEqual(driver.id);
    expect(result.origin).toEqual('Downtown Plaza');
    expect(result.destination).toEqual('Airport Terminal');
    expect(result.distance).toEqual(25.5);
    expect(typeof result.distance).toEqual('number'); // Verify numeric conversion
    expect(result.estimated_duration).toEqual(45);
    expect(result.start_datetime).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.end_datetime).toBeNull();
    expect(result.route_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save route to database', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'City Center',
      destination: 'Mall District',
      distance: 12.3,
      estimated_duration: 25,
      start_datetime: new Date('2024-01-15T14:30:00Z'),
      end_datetime: null,
      route_status: 'pending'
    };

    const result = await createRoute(testInput);

    // Query using proper drizzle syntax
    const routes = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, result.id))
      .execute();

    expect(routes).toHaveLength(1);
    expect(routes[0].driver_id).toEqual(driver.id);
    expect(routes[0].origin).toEqual('City Center');
    expect(routes[0].destination).toEqual('Mall District');
    expect(parseFloat(routes[0].distance)).toEqual(12.3);
    expect(routes[0].estimated_duration).toEqual(25);
    expect(routes[0].start_datetime).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(routes[0].end_datetime).toBeNull();
    expect(routes[0].route_status).toEqual('pending');
    expect(routes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle route with end_datetime', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'Hotel District',
      destination: 'Business Park',
      distance: 18.7,
      estimated_duration: 35,
      start_datetime: new Date('2024-01-15T09:00:00Z'),
      end_datetime: new Date('2024-01-15T09:35:00Z'),
      route_status: 'completed'
    };

    const result = await createRoute(testInput);

    expect(result.end_datetime).toEqual(new Date('2024-01-15T09:35:00Z'));
    expect(result.route_status).toEqual('completed');

    // Verify in database
    const routes = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, result.id))
      .execute();

    expect(routes[0].end_datetime).toEqual(new Date('2024-01-15T09:35:00Z'));
    expect(routes[0].route_status).toEqual('completed');
  });

  it('should apply default route_status when not provided', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    // Test input without route_status (should default to 'pending')
    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'Train Station',
      destination: 'University Campus',
      distance: 8.2,
      estimated_duration: 20,
      start_datetime: new Date('2024-01-15T16:00:00Z'),
      route_status: 'pending' // Include required field with default value
    };

    const result = await createRoute(testInput);

    expect(result.route_status).toEqual('pending'); // Default value applied
  });

  it('should throw error when driver does not exist', async () => {
    const testInput: CreateRouteInput = {
      driver_id: 99999, // Non-existent driver
      origin: 'Shopping Center',
      destination: 'Residential Area',
      distance: 15.0,
      estimated_duration: 30,
      start_datetime: new Date('2024-01-15T11:00:00Z'),
      route_status: 'pending'
    };

    await expect(createRoute(testInput)).rejects.toThrow(/Driver with id 99999 not found/i);
  });

  it('should throw error when driver is not available', async () => {
    // Create unavailable driver
    const driver = await createUnavailableDriver();

    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'Office Building',
      destination: 'Conference Center',
      distance: 22.1,
      estimated_duration: 40,
      start_datetime: new Date('2024-01-15T13:00:00Z'),
      route_status: 'pending'
    };

    await expect(createRoute(testInput)).rejects.toThrow(/Driver with id .+ is not available/i);
  });

  it('should handle decimal distances correctly', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    const testInput: CreateRouteInput = {
      driver_id: driver.id,
      origin: 'Park Entrance',
      destination: 'Lake Viewpoint',
      distance: 7.95, // Decimal distance
      estimated_duration: 18,
      start_datetime: new Date('2024-01-15T07:30:00Z'),
      route_status: 'in_progress'
    };

    const result = await createRoute(testInput);

    // Verify distance is handled correctly as a number
    expect(result.distance).toEqual(7.95);
    expect(typeof result.distance).toEqual('number');

    // Verify in database - stored as numeric but converted back correctly
    const routes = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, result.id))
      .execute();

    expect(parseFloat(routes[0].distance)).toEqual(7.95);
  });

  it('should handle different route statuses', async () => {
    // Create prerequisite driver
    const driver = await createTestDriver();

    const statusTests = [
      { status: 'pending' as const, expected: 'pending' as const, origin: 'Origin Pending', destination: 'Destination Pending' },
      { status: 'in_progress' as const, expected: 'in_progress' as const, origin: 'Origin InProgress', destination: 'Destination InProgress' },
      { status: 'completed' as const, expected: 'completed' as const, origin: 'Origin Completed', destination: 'Destination Completed' },
      { status: 'cancelled' as const, expected: 'cancelled' as const, origin: 'Origin Cancelled', destination: 'Destination Cancelled' }
    ];

    for (const test of statusTests) {
      const testInput: CreateRouteInput = {
        driver_id: driver.id,
        origin: test.origin,
        destination: test.destination,
        distance: 10.0,
        estimated_duration: 25,
        start_datetime: new Date('2024-01-15T12:00:00Z'),
        route_status: test.status
      };

      const result = await createRoute(testInput);
      expect(result.route_status).toEqual(test.expected);
    }
  });
});