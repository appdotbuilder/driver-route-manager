import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routesTable, driversTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';
import { deleteRoute } from '../handlers/delete_route';

describe('deleteRoute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test driver
  const createTestDriver = async () => {
    const result = await db.insert(driversTable)
      .values({
        name: 'Test Driver',
        email: 'driver@test.com',
        phone: '555-0100',
        license_number: 'D123456789',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_license_plate: 'ABC123',
        availability_status: 'available'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  // Helper function to create a test route
  const createTestRoute = async (driverId: number, status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending') => {
    const result = await db.insert(routesTable)
      .values({
        driver_id: driverId,
        origin: 'Origin City',
        destination: 'Destination City',
        distance: '100.50', // Convert to string for numeric column
        estimated_duration: 120,
        start_datetime: new Date('2024-01-01T10:00:00Z'),
        route_status: status
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should delete a pending route successfully', async () => {
    // Create prerequisite driver and route
    const driver = await createTestDriver();
    const route = await createTestRoute(driver.id, 'pending');

    const input: DeleteInput = { id: route.id };

    const result = await deleteRoute(input);

    expect(result.success).toBe(true);

    // Verify the route was deleted from the database
    const deletedRoute = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, route.id))
      .execute();

    expect(deletedRoute).toHaveLength(0);
  });

  it('should delete a cancelled route successfully', async () => {
    // Create prerequisite driver and route
    const driver = await createTestDriver();
    const route = await createTestRoute(driver.id, 'cancelled');

    const input: DeleteInput = { id: route.id };

    const result = await deleteRoute(input);

    expect(result.success).toBe(true);

    // Verify the route was deleted from the database
    const deletedRoute = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, route.id))
      .execute();

    expect(deletedRoute).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent route', async () => {
    const input: DeleteInput = { id: 9999 };

    await expect(deleteRoute(input)).rejects.toThrow(/Route with ID 9999 not found/i);
  });

  it('should throw error when trying to delete in-progress route', async () => {
    // Create prerequisite driver and route
    const driver = await createTestDriver();
    const route = await createTestRoute(driver.id, 'in_progress');

    const input: DeleteInput = { id: route.id };

    await expect(deleteRoute(input)).rejects.toThrow(/Cannot delete route with status 'in_progress'/i);

    // Verify the route still exists in the database
    const existingRoute = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, route.id))
      .execute();

    expect(existingRoute).toHaveLength(1);
  });

  it('should throw error when trying to delete completed route', async () => {
    // Create prerequisite driver and route
    const driver = await createTestDriver();
    const route = await createTestRoute(driver.id, 'completed');

    const input: DeleteInput = { id: route.id };

    await expect(deleteRoute(input)).rejects.toThrow(/Cannot delete route with status 'completed'/i);

    // Verify the route still exists in the database
    const existingRoute = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, route.id))
      .execute();

    expect(existingRoute).toHaveLength(1);
  });

  it('should preserve other routes when deleting one route', async () => {
    // Create prerequisite driver and multiple routes
    const driver = await createTestDriver();
    const route1 = await createTestRoute(driver.id, 'pending');
    const route2 = await createTestRoute(driver.id, 'cancelled');
    const route3 = await createTestRoute(driver.id, 'completed');

    const input: DeleteInput = { id: route1.id };

    const result = await deleteRoute(input);

    expect(result.success).toBe(true);

    // Verify only the target route was deleted
    const remainingRoutes = await db.select()
      .from(routesTable)
      .execute();

    expect(remainingRoutes).toHaveLength(2);
    expect(remainingRoutes.find(r => r.id === route1.id)).toBeUndefined();
    expect(remainingRoutes.find(r => r.id === route2.id)).toBeDefined();
    expect(remainingRoutes.find(r => r.id === route3.id)).toBeDefined();
  });

  it('should handle database constraints properly', async () => {
    // Create prerequisite driver and route
    const driver = await createTestDriver();
    const route = await createTestRoute(driver.id, 'pending');

    // Delete the route
    const input: DeleteInput = { id: route.id };
    await deleteRoute(input);

    // Attempting to delete the same route again should throw error
    await expect(deleteRoute(input)).rejects.toThrow(/Route with ID .* not found/i);
  });
});