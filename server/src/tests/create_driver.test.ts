import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { driversTable } from '../db/schema';
import { type CreateDriverInput } from '../schema';
import { createDriver } from '../handlers/create_driver';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDriverInput = {
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1-555-123-4567',
  license_number: 'DL123456789',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_license_plate: 'ABC-123',
  availability_status: 'available'
};

describe('createDriver', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a driver with all fields', async () => {
    const result = await createDriver(testInput);

    // Validate all returned fields
    expect(result.name).toEqual('John Smith');
    expect(result.email).toEqual('john.smith@example.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.license_number).toEqual('DL123456789');
    expect(result.vehicle_make).toEqual('Toyota');
    expect(result.vehicle_model).toEqual('Camry');
    expect(result.vehicle_license_plate).toEqual('ABC-123');
    expect(result.availability_status).toEqual('available');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save driver to database', async () => {
    const result = await createDriver(testInput);

    // Query database to verify the driver was saved
    const drivers = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, result.id))
      .execute();

    expect(drivers).toHaveLength(1);
    const savedDriver = drivers[0];
    
    expect(savedDriver.name).toEqual('John Smith');
    expect(savedDriver.email).toEqual('john.smith@example.com');
    expect(savedDriver.phone).toEqual('+1-555-123-4567');
    expect(savedDriver.license_number).toEqual('DL123456789');
    expect(savedDriver.vehicle_make).toEqual('Toyota');
    expect(savedDriver.vehicle_model).toEqual('Camry');
    expect(savedDriver.vehicle_license_plate).toEqual('ABC-123');
    expect(savedDriver.availability_status).toEqual('available');
    expect(savedDriver.created_at).toBeInstanceOf(Date);
  });

  it('should create driver with unavailable status', async () => {
    const unavailableInput: CreateDriverInput = {
      ...testInput,
      availability_status: 'unavailable'
    };

    const result = await createDriver(unavailableInput);

    expect(result.availability_status).toEqual('unavailable');

    // Verify in database
    const drivers = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, result.id))
      .execute();

    expect(drivers[0].availability_status).toEqual('unavailable');
  });

  it('should apply default availability status when not provided', async () => {
    // Create input without availability_status to test Zod default
    const inputWithoutStatus = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1-555-987-6543',
      license_number: 'DL987654321',
      vehicle_make: 'Honda',
      vehicle_model: 'Civic',
      vehicle_license_plate: 'XYZ-789'
    } as CreateDriverInput; // Zod will apply default

    const result = await createDriver(inputWithoutStatus);

    expect(result.availability_status).toEqual('available'); // Default value
  });

  it('should create multiple drivers with unique IDs', async () => {
    const secondInput: CreateDriverInput = {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-555-5555',
      license_number: 'DL555555555',
      vehicle_make: 'Ford',
      vehicle_model: 'Focus',
      vehicle_license_plate: 'DEF-456',
      availability_status: 'unavailable'
    };

    const driver1 = await createDriver(testInput);
    const driver2 = await createDriver(secondInput);

    // Verify unique IDs
    expect(driver1.id).not.toEqual(driver2.id);
    
    // Verify both drivers exist in database
    const allDrivers = await db.select().from(driversTable).execute();
    expect(allDrivers).toHaveLength(2);
    
    const driverNames = allDrivers.map(d => d.name).sort();
    expect(driverNames).toEqual(['John Smith', 'Sarah Johnson']);
  });

  it('should handle edge case data correctly', async () => {
    const edgeCaseInput: CreateDriverInput = {
      name: 'Driver With Very Long Name That Should Still Be Accepted',
      email: 'very.long.email.address.that.should.work@verylongdomainname.example.com',
      phone: '+1-555-123-4567-ext-999',
      license_number: 'DL-VERY-LONG-LICENSE-NUMBER-123456789',
      vehicle_make: 'Mercedes-Benz',
      vehicle_model: 'S-Class AMG',
      vehicle_license_plate: 'CUSTOM-PLATE-123',
      availability_status: 'available'
    };

    const result = await createDriver(edgeCaseInput);

    expect(result.name).toEqual(edgeCaseInput.name);
    expect(result.email).toEqual(edgeCaseInput.email);
    expect(result.phone).toEqual(edgeCaseInput.phone);
    expect(result.license_number).toEqual(edgeCaseInput.license_number);
    expect(result.vehicle_make).toEqual(edgeCaseInput.vehicle_make);
    expect(result.vehicle_model).toEqual(edgeCaseInput.vehicle_model);
    expect(result.vehicle_license_plate).toEqual(edgeCaseInput.vehicle_license_plate);

    // Verify persistence in database
    const drivers = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, result.id))
      .execute();

    expect(drivers).toHaveLength(1);
    expect(drivers[0].name).toEqual(edgeCaseInput.name);
  });
});