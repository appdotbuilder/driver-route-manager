import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type UpdateRouteInput, type CreateDriverInput } from '../schema';
import { updateRoute } from '../handlers/update_route';
import { eq } from 'drizzle-orm';

// Test data for creating a driver
const testDriver: CreateDriverInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  license_number: 'DL123456',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC123',
  availability_status: 'available'
};

// Test data for creating another driver
const testDriver2: CreateDriverInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '098-765-4321',
  license_number: 'DL789012',
  vehicle_make: 'Honda',
  vehicle_model: 'Civic',
  vehicle_license_plate: 'XYZ789',
  availability_status: 'available'
};

describe('updateRoute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update route fields correctly', async () => {
    // Create a driver first
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

    const driverId = driverResult[0].id;

    // Create a route
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Old Origin',
        destination: 'Old Destination',
        distance: '10.50',
        estimated_duration: 30,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        route_status: 'pending'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Update the route
    const updateInput: UpdateRouteInput = {
      id: routeId,
      origin: 'New Origin',
      destination: 'New Destination',
      distance: 25.75,
      estimated_duration: 60,
      route_status: 'in_progress'
    };

    const result = await updateRoute(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(routeId);
    expect(result.origin).toEqual('New Origin');
    expect(result.destination).toEqual('New Destination');
    expect(result.distance).toEqual(25.75);
    expect(result.estimated_duration).toEqual(60);
    expect(result.route_status).toEqual('in_progress');
    expect(result.driver_id).toEqual(driverId); // Should remain unchanged
    expect(typeof result.distance).toBe('number');
  });

  it('should update driver_id when new driver exists', async () => {
    // Create two drivers
    const driver1Result = await db.insert(driversTable)
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

    const driver2Result = await db.insert(driversTable)
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

    const driver1Id = driver1Result[0].id;
    const driver2Id = driver2Result[0].id;

    // Create a route with first driver
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driver1Id,
        origin: 'Test Origin',
        destination: 'Test Destination',
        distance: '15.00',
        estimated_duration: 45,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        route_status: 'pending'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Update route to use second driver
    const updateInput: UpdateRouteInput = {
      id: routeId,
      driver_id: driver2Id
    };

    const result = await updateRoute(updateInput);

    expect(result.driver_id).toEqual(driver2Id);
    expect(result.origin).toEqual('Test Origin'); // Should remain unchanged
  });

  it('should update route in database correctly', async () => {
    // Create a driver
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

    const driverId = driverResult[0].id;

    // Create a route
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Original Origin',
        destination: 'Original Destination',
        distance: '20.00',
        estimated_duration: 50,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        route_status: 'pending'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Update the route
    const updateInput: UpdateRouteInput = {
      id: routeId,
      origin: 'Updated Origin',
      distance: 30.25,
      route_status: 'completed',
      end_datetime: new Date('2024-01-01T12:00:00Z')
    };

    await updateRoute(updateInput);

    // Verify the route was updated in the database
    const routes = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, routeId))
      .execute();

    expect(routes).toHaveLength(1);
    const route = routes[0];
    expect(route.origin).toEqual('Updated Origin');
    expect(parseFloat(route.distance)).toEqual(30.25);
    expect(route.route_status).toEqual('completed');
    expect(route.end_datetime).toBeInstanceOf(Date);
    expect(route.destination).toEqual('Original Destination'); // Should remain unchanged
  });

  it('should handle nullable end_datetime correctly', async () => {
    // Create a driver
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

    const driverId = driverResult[0].id;

    // Create a route with end_datetime
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Test Origin',
        destination: 'Test Destination',
        distance: '10.00',
        estimated_duration: 30,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        end_datetime: new Date('2024-01-01T11:00:00Z'),
        route_status: 'completed'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Update to set end_datetime to null
    const updateInput: UpdateRouteInput = {
      id: routeId,
      end_datetime: null,
      route_status: 'in_progress'
    };

    const result = await updateRoute(updateInput);

    expect(result.end_datetime).toBeNull();
    expect(result.route_status).toEqual('in_progress');
  });

  it('should throw error when route not found', async () => {
    const updateInput: UpdateRouteInput = {
      id: 999999, // Non-existent ID
      origin: 'New Origin'
    };

    expect(updateRoute(updateInput)).rejects.toThrow(/route with id 999999 not found/i);
  });

  it('should throw error when new driver does not exist', async () => {
    // Create a driver
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

    const driverId = driverResult[0].id;

    // Create a route
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Test Origin',
        destination: 'Test Destination',
        distance: '10.00',
        estimated_duration: 30,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        route_status: 'pending'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Try to update with non-existent driver
    const updateInput: UpdateRouteInput = {
      id: routeId,
      driver_id: 999999 // Non-existent driver ID
    };

    expect(updateRoute(updateInput)).rejects.toThrow(/driver with id 999999 not found/i);
  });

  it('should update only specified fields', async () => {
    // Create a driver
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

    const driverId = driverResult[0].id;

    // Create a route
    const originalStartDate = new Date('2024-01-01T10:00:00Z');
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Original Origin',
        destination: 'Original Destination',
        distance: '15.50',
        estimated_duration: 40,
        start_datetime: originalStartDate,
        route_status: 'pending'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Update only the route status
    const updateInput: UpdateRouteInput = {
      id: routeId,
      route_status: 'in_progress'
    };

    const result = await updateRoute(updateInput);

    // Verify only status changed, other fields remain the same
    expect(result.route_status).toEqual('in_progress');
    expect(result.origin).toEqual('Original Origin');
    expect(result.destination).toEqual('Original Destination');
    expect(result.distance).toEqual(15.5);
    expect(result.estimated_duration).toEqual(40);
    expect(result.driver_id).toEqual(driverId);
    expect(result.start_datetime).toEqual(originalStartDate);
  });
});