import { db } from '../db';
import { driversTable } from '../db/schema';
import { type CreateDriverInput, type Driver } from '../schema';

export const createDriver = async (input: CreateDriverInput): Promise<Driver> => {
  try {
    // Insert driver record
    const result = await db.insert(driversTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        license_number: input.license_number,
        vehicle_make: input.vehicle_make,
        vehicle_model: input.vehicle_model,
        vehicle_license_plate: input.vehicle_license_plate,
        availability_status: input.availability_status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Driver creation failed:', error);
    throw error;
  }
};