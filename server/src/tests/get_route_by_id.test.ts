import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { type GetByIdInput, type CreateDriverInput, type CreateRouteInput } from '../schema';
import { getRouteById } from '../handlers/get_route_by_id';

// Test driver data
const testDriver: CreateDriverInput = {
  name: 'John Driver',
  email: 'john.driver@example.com',
  phone: '+1234567890',
  license_number: 'DL123456789',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC-1234',
  availability_status: 'available'
};

// Test route data
const testRoute = {
  driver_id: 1, // Will be set after creating driver
  origin: 'City A',
  destination: 'City B',
  distance: 125.50,
  estimated_duration: 180,
  start_datetime: new Date('2024-01-15T09:00:00Z'),
  end_datetime: new Date('2024-01-15T12:00:00Z') as Date | null,
  route_status: 'completed' as const
};

describe('getRouteById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return route with driver information when route exists', async () => {
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
        origin: testRoute.origin,
        destination: testRoute.destination,
        distance: testRoute.distance.toString(), // Convert to string for numeric column
        estimated_duration: testRoute.estimated_duration,
        start_datetime: testRoute.start_datetime,
        end_datetime: testRoute.end_datetime,
        route_status: testRoute.route_status
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: routeId };
    const result = await getRouteById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(routeId);
    expect(result!.driver_id).toEqual(driverId);
    expect(result!.origin).toEqual('City A');
    expect(result!.destination).toEqual('City B');
    expect(result!.distance).toEqual(125.50);
    expect(typeof result!.distance).toEqual('number'); // Verify numeric conversion
    expect(result!.estimated_duration).toEqual(180);
    expect(result!.start_datetime).toEqual(testRoute.start_datetime);
    expect(result!.end_datetime).toEqual(testRoute.end_datetime);
    expect(result!.route_status).toEqual('completed');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify driver information is included
    expect(result!.driver).toBeDefined();
    expect(result!.driver.id).toEqual(driverId);
    expect(result!.driver.name).toEqual('John Driver');
    expect(result!.driver.email).toEqual(testDriver.email);
    expect(result!.driver.phone).toEqual(testDriver.phone);
    expect(result!.driver.license_number).toEqual(testDriver.license_number);
    expect(result!.driver.vehicle_make).toEqual('Toyota');
    expect(result!.driver.vehicle_model).toEqual('Camry');
    expect(result!.driver.vehicle_license_plate).toEqual('ABC-1234');
    expect(result!.driver.availability_status).toEqual('available');
    expect(result!.driver.created_at).toBeInstanceOf(Date);
  });

  it('should return null when route does not exist', async () => {
    const input: GetByIdInput = { id: 999 };
    const result = await getRouteById(input);

    expect(result).toBeNull();
  });

  it('should handle route with null end_datetime', async () => {
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

    // Create a route with null end_datetime
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'City C',
        destination: 'City D',
        distance: '75.25', // String for numeric column
        estimated_duration: 120,
        start_datetime: new Date('2024-01-16T10:00:00Z'),
        end_datetime: null, // Null end datetime
        route_status: 'in_progress'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: routeId };
    const result = await getRouteById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(routeId);
    expect(result!.origin).toEqual('City C');
    expect(result!.destination).toEqual('City D');
    expect(result!.distance).toEqual(75.25);
    expect(typeof result!.distance).toEqual('number'); // Verify numeric conversion
    expect(result!.end_datetime).toBeNull();
    expect(result!.route_status).toEqual('in_progress');

    // Verify driver information is still included
    expect(result!.driver).toBeDefined();
    expect(result!.driver.id).toEqual(driverId);
    expect(result!.driver.name).toEqual('John Driver');
  });

  it('should handle different route statuses and driver availability', async () => {
    // Create driver with unavailable status
    const driverResult = await db.insert(driversTable)
      .values({
        name: 'Jane Driver',
        email: 'jane.driver@example.com',
        phone: '+9876543210',
        license_number: 'DL987654321',
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        vehicle_license_plate: 'XYZ-9876',
        availability_status: 'unavailable'
      })
      .returning()
      .execute();

    const driverId = driverResult[0].id;

    // Create a cancelled route
    const routeResult = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Airport',
        destination: 'Downtown',
        distance: '15.75',
        estimated_duration: 45,
        start_datetime: new Date('2024-01-17T08:00:00Z'),
        end_datetime: null,
        route_status: 'cancelled'
      })
      .returning()
      .execute();

    const routeId = routeResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: routeId };
    const result = await getRouteById(input);

    expect(result).not.toBeNull();
    expect(result!.route_status).toEqual('cancelled');
    expect(result!.driver.name).toEqual('Jane Driver');
    expect(result!.driver.availability_status).toEqual('unavailable');
    expect(result!.driver.vehicle_make).toEqual('Honda');
    expect(result!.driver.vehicle_model).toEqual('Civic');
  });
});