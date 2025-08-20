import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable, routesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteDriver } from '../handlers/delete_driver';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteInput = {
  id: 1
};

// Test driver data
const testDriverData = {
  name: 'Test Driver',
  email: 'test.driver@example.com',
  phone: '555-0123',
  license_number: 'DL123456789',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC123',
  availability_status: 'available' as const
};

// Test route data
const testRouteData = {
  driver_id: 1,
  origin: 'Downtown',
  destination: 'Airport',
  distance: '25.5',
  estimated_duration: 45,
  start_datetime: new Date('2024-01-15T10:00:00Z'),
  end_datetime: null,
  route_status: 'pending' as const
};

describe('deleteDriver', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing driver with no routes', async () => {
    // Create a test driver
    const createdDriver = await db.insert(driversTable)
      .values(testDriverData)
      .returning()
      .execute();

    const driverId = createdDriver[0].id;

    // Delete the driver
    const result = await deleteDriver({ id: driverId });

    // Verify success response
    expect(result.success).toBe(true);

    // Verify driver was actually deleted from database
    const deletedDriver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, driverId))
      .execute();

    expect(deletedDriver).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent driver', async () => {
    const nonExistentId = 999;

    // Attempt to delete non-existent driver
    await expect(deleteDriver({ id: nonExistentId }))
      .rejects
      .toThrow(/Driver with id 999 not found/i);
  });

  it('should throw error when trying to delete driver with associated routes', async () => {
    // Create a test driver
    const createdDriver = await db.insert(driversTable)
      .values(testDriverData)
      .returning()
      .execute();

    const driverId = createdDriver[0].id;

    // Create a route associated with the driver
    await db.insert(routesTable)
      .values({
        ...testRouteData,
        driver_id: driverId
      })
      .execute();

    // Attempt to delete driver with associated routes
    await expect(deleteDriver({ id: driverId }))
      .rejects
      .toThrow(/Cannot delete driver with id \d+ because they have associated routes/i);

    // Verify driver still exists in database
    const existingDriver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, driverId))
      .execute();

    expect(existingDriver).toHaveLength(1);
    expect(existingDriver[0].name).toEqual('Test Driver');
  });

  it('should handle driver with multiple routes correctly', async () => {
    // Create a test driver
    const createdDriver = await db.insert(driversTable)
      .values(testDriverData)
      .returning()
      .execute();

    const driverId = createdDriver[0].id;

    // Create multiple routes for the driver
    const route1 = {
      ...testRouteData,
      driver_id: driverId,
      destination: 'Airport'
    };
    
    const route2 = {
      ...testRouteData,
      driver_id: driverId,
      destination: 'Mall',
      start_datetime: new Date('2024-01-16T14:00:00Z')
    };

    await db.insert(routesTable)
      .values([route1, route2])
      .execute();

    // Attempt to delete driver with multiple routes
    await expect(deleteDriver({ id: driverId }))
      .rejects
      .toThrow(/Cannot delete driver with id \d+ because they have associated routes/i);

    // Verify driver still exists
    const existingDriver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, driverId))
      .execute();

    expect(existingDriver).toHaveLength(1);
  });

  it('should handle edge case with completed routes', async () => {
    // Create a test driver
    const createdDriver = await db.insert(driversTable)
      .values(testDriverData)
      .returning()
      .execute();

    const driverId = createdDriver[0].id;

    // Create a completed route for the driver
    await db.insert(routesTable)
      .values({
        ...testRouteData,
        driver_id: driverId,
        route_status: 'completed',
        end_datetime: new Date('2024-01-15T11:00:00Z')
      })
      .execute();

    // Should still prevent deletion even for completed routes
    await expect(deleteDriver({ id: driverId }))
      .rejects
      .toThrow(/Cannot delete driver with id \d+ because they have associated routes/i);
  });
});