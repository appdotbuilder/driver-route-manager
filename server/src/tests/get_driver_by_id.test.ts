import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable } from '../db/schema';
import { type GetByIdInput, type CreateDriverInput } from '../schema';
import { getDriverById } from '../handlers/get_driver_by_id';

// Test driver data
const testDriverInput: CreateDriverInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  license_number: 'DL12345678',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC-1234',
  availability_status: 'available'
};

describe('getDriverById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return driver when ID exists', async () => {
    // Create a test driver first
    const insertResult = await db.insert(driversTable)
      .values({
        name: testDriverInput.name,
        email: testDriverInput.email,
        phone: testDriverInput.phone,
        license_number: testDriverInput.license_number,
        vehicle_make: testDriverInput.vehicle_make,
        vehicle_model: testDriverInput.vehicle_model,
        vehicle_license_plate: testDriverInput.vehicle_license_plate,
        availability_status: testDriverInput.availability_status
      })
      .returning()
      .execute();

    const createdDriver = insertResult[0];
    const input: GetByIdInput = { id: createdDriver.id };

    // Test the handler
    const result = await getDriverById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdDriver.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('+1-555-0123');
    expect(result!.license_number).toEqual('DL12345678');
    expect(result!.vehicle_make).toEqual('Toyota');
    expect(result!.vehicle_model).toEqual('Camry');
    expect(result!.vehicle_license_plate).toEqual('ABC-1234');
    expect(result!.availability_status).toEqual('available');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    const input: GetByIdInput = { id: 99999 };

    // Test the handler
    const result = await getDriverById(input);

    // Verify the result is null
    expect(result).toBeNull();
  });

  it('should return correct driver from multiple drivers', async () => {
    // Create multiple test drivers
    const driver1Data = {
      name: 'Driver One',
      email: 'driver1@example.com',
      phone: '+1-555-0001',
      license_number: 'DL11111111',
      vehicle_make: 'Honda',
      vehicle_model: 'Civic',
      vehicle_license_plate: 'XYZ-1111',
      availability_status: 'available' as const
    };

    const driver2Data = {
      name: 'Driver Two',
      email: 'driver2@example.com',
      phone: '+1-555-0002',
      license_number: 'DL22222222',
      vehicle_make: 'Ford',
      vehicle_model: 'Focus',
      vehicle_license_plate: 'XYZ-2222',
      availability_status: 'unavailable' as const
    };

    // Insert drivers
    const insertResults = await db.insert(driversTable)
      .values([driver1Data, driver2Data])
      .returning()
      .execute();

    const createdDriver1 = insertResults[0];
    const createdDriver2 = insertResults[1];

    // Test fetching first driver
    const input1: GetByIdInput = { id: createdDriver1.id };
    const result1 = await getDriverById(input1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(createdDriver1.id);
    expect(result1!.name).toEqual('Driver One');
    expect(result1!.email).toEqual('driver1@example.com');
    expect(result1!.availability_status).toEqual('available');

    // Test fetching second driver
    const input2: GetByIdInput = { id: createdDriver2.id };
    const result2 = await getDriverById(input2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(createdDriver2.id);
    expect(result2!.name).toEqual('Driver Two');
    expect(result2!.email).toEqual('driver2@example.com');
    expect(result2!.availability_status).toEqual('unavailable');

    // Verify they are different drivers
    expect(result1!.id).not.toEqual(result2!.id);
  });

  it('should handle different availability statuses', async () => {
    // Create driver with unavailable status
    const unavailableDriverData = {
      name: 'Unavailable Driver',
      email: 'unavailable@example.com',
      phone: '+1-555-0099',
      license_number: 'DL99999999',
      vehicle_make: 'Nissan',
      vehicle_model: 'Altima',
      vehicle_license_plate: 'UNA-9999',
      availability_status: 'unavailable' as const
    };

    const insertResult = await db.insert(driversTable)
      .values(unavailableDriverData)
      .returning()
      .execute();

    const createdDriver = insertResult[0];
    const input: GetByIdInput = { id: createdDriver.id };

    // Test the handler
    const result = await getDriverById(input);

    // Verify the result includes correct availability status
    expect(result).not.toBeNull();
    expect(result!.availability_status).toEqual('unavailable');
    expect(result!.name).toEqual('Unavailable Driver');
  });
});