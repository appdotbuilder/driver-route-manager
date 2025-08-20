import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable } from '../db/schema';
import { type UpdateDriverInput, type CreateDriverInput } from '../schema';
import { updateDriver } from '../handlers/update_driver';
import { eq } from 'drizzle-orm';

// Test input for creating a driver
const testCreateInput: CreateDriverInput = {
  name: 'John Driver',
  email: 'john.driver@example.com',
  phone: '+1234567890',
  license_number: 'DL123456789',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC-123',
  availability_status: 'available'
};

describe('updateDriver', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all driver fields', async () => {
    // Create a driver first
    const createResult = await db.insert(driversTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        license_number: testCreateInput.license_number,
        vehicle_make: testCreateInput.vehicle_make,
        vehicle_model: testCreateInput.vehicle_model,
        vehicle_license_plate: testCreateInput.vehicle_license_plate,
        availability_status: testCreateInput.availability_status
      })
      .returning()
      .execute();

    const driverId = createResult[0].id;

    // Update the driver with all new values
    const updateInput: UpdateDriverInput = {
      id: driverId,
      name: 'Jane Updated',
      email: 'jane.updated@example.com',
      phone: '+0987654321',
      license_number: 'DL987654321',
      vehicle_make: 'Honda',
      vehicle_model: 'Accord',
      vehicle_license_plate: 'XYZ-789',
      availability_status: 'unavailable'
    };

    const result = await updateDriver(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(driverId);
    expect(result.name).toEqual('Jane Updated');
    expect(result.email).toEqual('jane.updated@example.com');
    expect(result.phone).toEqual('+0987654321');
    expect(result.license_number).toEqual('DL987654321');
    expect(result.vehicle_make).toEqual('Honda');
    expect(result.vehicle_model).toEqual('Accord');
    expect(result.vehicle_license_plate).toEqual('XYZ-789');
    expect(result.availability_status).toEqual('unavailable');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a driver first
    const createResult = await db.insert(driversTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        license_number: testCreateInput.license_number,
        vehicle_make: testCreateInput.vehicle_make,
        vehicle_model: testCreateInput.vehicle_model,
        vehicle_license_plate: testCreateInput.vehicle_license_plate,
        availability_status: testCreateInput.availability_status
      })
      .returning()
      .execute();

    const driverId = createResult[0].id;

    // Update only name and availability_status
    const updateInput: UpdateDriverInput = {
      id: driverId,
      name: 'Updated Name Only',
      availability_status: 'unavailable'
    };

    const result = await updateDriver(updateInput);

    // Verify only specified fields are updated, others remain the same
    expect(result.id).toEqual(driverId);
    expect(result.name).toEqual('Updated Name Only');
    expect(result.email).toEqual(testCreateInput.email); // Should remain unchanged
    expect(result.phone).toEqual(testCreateInput.phone); // Should remain unchanged
    expect(result.license_number).toEqual(testCreateInput.license_number); // Should remain unchanged
    expect(result.vehicle_make).toEqual(testCreateInput.vehicle_make); // Should remain unchanged
    expect(result.vehicle_model).toEqual(testCreateInput.vehicle_model); // Should remain unchanged
    expect(result.vehicle_license_plate).toEqual(testCreateInput.vehicle_license_plate); // Should remain unchanged
    expect(result.availability_status).toEqual('unavailable');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated driver to database', async () => {
    // Create a driver first
    const createResult = await db.insert(driversTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        license_number: testCreateInput.license_number,
        vehicle_make: testCreateInput.vehicle_make,
        vehicle_model: testCreateInput.vehicle_model,
        vehicle_license_plate: testCreateInput.vehicle_license_plate,
        availability_status: testCreateInput.availability_status
      })
      .returning()
      .execute();

    const driverId = createResult[0].id;

    // Update the driver
    const updateInput: UpdateDriverInput = {
      id: driverId,
      name: 'Database Test Driver',
      email: 'database.test@example.com'
    };

    await updateDriver(updateInput);

    // Query database directly to verify changes were saved
    const drivers = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, driverId))
      .execute();

    expect(drivers).toHaveLength(1);
    expect(drivers[0].name).toEqual('Database Test Driver');
    expect(drivers[0].email).toEqual('database.test@example.com');
    expect(drivers[0].phone).toEqual(testCreateInput.phone); // Should remain unchanged
    expect(drivers[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when driver does not exist', async () => {
    const updateInput: UpdateDriverInput = {
      id: 99999, // Non-existent driver ID
      name: 'Non-existent Driver'
    };

    await expect(() => updateDriver(updateInput)).toThrow(/Driver with id 99999 not found/i);
  });

  it('should update availability status correctly', async () => {
    // Create a driver with 'available' status
    const createResult = await db.insert(driversTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        license_number: testCreateInput.license_number,
        vehicle_make: testCreateInput.vehicle_make,
        vehicle_model: testCreateInput.vehicle_model,
        vehicle_license_plate: testCreateInput.vehicle_license_plate,
        availability_status: 'available'
      })
      .returning()
      .execute();

    const driverId = createResult[0].id;

    // Update to unavailable
    const updateInput: UpdateDriverInput = {
      id: driverId,
      availability_status: 'unavailable'
    };

    const result = await updateDriver(updateInput);

    expect(result.availability_status).toEqual('unavailable');
    expect(result.name).toEqual(testCreateInput.name); // Should remain unchanged

    // Verify in database
    const drivers = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, driverId))
      .execute();

    expect(drivers[0].availability_status).toEqual('unavailable');
  });

  it('should handle empty update gracefully', async () => {
    // Create a driver first
    const createResult = await db.insert(driversTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        license_number: testCreateInput.license_number,
        vehicle_make: testCreateInput.vehicle_make,
        vehicle_model: testCreateInput.vehicle_model,
        vehicle_license_plate: testCreateInput.vehicle_license_plate,
        availability_status: testCreateInput.availability_status
      })
      .returning()
      .execute();

    const driverId = createResult[0].id;
    const originalDriver = createResult[0];

    // Update with no fields to change
    const updateInput: UpdateDriverInput = {
      id: driverId
    };

    const result = await updateDriver(updateInput);

    // All fields should remain the same
    expect(result.id).toEqual(driverId);
    expect(result.name).toEqual(originalDriver.name);
    expect(result.email).toEqual(originalDriver.email);
    expect(result.phone).toEqual(originalDriver.phone);
    expect(result.license_number).toEqual(originalDriver.license_number);
    expect(result.vehicle_make).toEqual(originalDriver.vehicle_make);
    expect(result.vehicle_model).toEqual(originalDriver.vehicle_model);
    expect(result.vehicle_license_plate).toEqual(originalDriver.vehicle_license_plate);
    expect(result.availability_status).toEqual(originalDriver.availability_status);
  });
});