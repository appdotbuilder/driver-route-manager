import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable } from '../db/schema';
import { type CreateDriverInput } from '../schema';
import { getDrivers } from '../handlers/get_drivers';

// Test driver data
const testDriver1: CreateDriverInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  license_number: 'DL12345678',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC-123',
  availability_status: 'available'
};

const testDriver2: CreateDriverInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1987654321',
  license_number: 'DL87654321',
  vehicle_make: 'Honda',
  vehicle_model: 'Civic',
  vehicle_license_plate: 'XYZ-789',
  availability_status: 'unavailable'
};

describe('getDrivers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no drivers exist', async () => {
    const result = await getDrivers();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all drivers from database', async () => {
    // Insert test drivers
    await db.insert(driversTable)
      .values([testDriver1, testDriver2])
      .execute();

    const result = await getDrivers();

    expect(result).toHaveLength(2);
    
    // Check first driver
    const driver1 = result.find(d => d.name === 'John Doe');
    expect(driver1).toBeDefined();
    expect(driver1!.email).toEqual('john.doe@example.com');
    expect(driver1!.phone).toEqual('+1234567890');
    expect(driver1!.license_number).toEqual('DL12345678');
    expect(driver1!.vehicle_make).toEqual('Toyota');
    expect(driver1!.vehicle_model).toEqual('Camry');
    expect(driver1!.vehicle_license_plate).toEqual('ABC-123');
    expect(driver1!.availability_status).toEqual('available');
    expect(driver1!.id).toBeDefined();
    expect(driver1!.created_at).toBeInstanceOf(Date);

    // Check second driver
    const driver2 = result.find(d => d.name === 'Jane Smith');
    expect(driver2).toBeDefined();
    expect(driver2!.email).toEqual('jane.smith@example.com');
    expect(driver2!.phone).toEqual('+1987654321');
    expect(driver2!.license_number).toEqual('DL87654321');
    expect(driver2!.vehicle_make).toEqual('Honda');
    expect(driver2!.vehicle_model).toEqual('Civic');
    expect(driver2!.vehicle_license_plate).toEqual('XYZ-789');
    expect(driver2!.availability_status).toEqual('unavailable');
    expect(driver2!.id).toBeDefined();
    expect(driver2!.created_at).toBeInstanceOf(Date);
  });

  it('should return drivers with correct data types', async () => {
    await db.insert(driversTable)
      .values([testDriver1])
      .execute();

    const result = await getDrivers();

    expect(result).toHaveLength(1);
    const driver = result[0];

    // Verify data types
    expect(typeof driver.id).toBe('number');
    expect(typeof driver.name).toBe('string');
    expect(typeof driver.email).toBe('string');
    expect(typeof driver.phone).toBe('string');
    expect(typeof driver.license_number).toBe('string');
    expect(typeof driver.vehicle_make).toBe('string');
    expect(typeof driver.vehicle_model).toBe('string');
    expect(typeof driver.vehicle_license_plate).toBe('string');
    expect(typeof driver.availability_status).toBe('string');
    expect(driver.created_at).toBeInstanceOf(Date);
  });

  it('should return drivers in database insertion order', async () => {
    // Insert drivers in specific order
    await db.insert(driversTable)
      .values([testDriver1])
      .execute();

    await db.insert(driversTable)
      .values([testDriver2])
      .execute();

    const result = await getDrivers();

    expect(result).toHaveLength(2);
    // First inserted driver should have smaller ID
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
  });

  it('should handle drivers with default availability status', async () => {
    // Insert driver without explicit availability_status (should default to 'available')
    const driverWithoutStatus = {
      name: 'Default Driver',
      email: 'default@example.com',
      phone: '+1111111111',
      license_number: 'DL11111111',
      vehicle_make: 'Ford',
      vehicle_model: 'Focus',
      vehicle_license_plate: 'DEF-456'
      // Note: availability_status omitted, should use default
    };

    await db.insert(driversTable)
      .values([driverWithoutStatus])
      .execute();

    const result = await getDrivers();

    expect(result).toHaveLength(1);
    expect(result[0].availability_status).toEqual('available');
  });
});