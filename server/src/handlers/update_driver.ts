import { db } from '../db';
import { driversTable } from '../db/schema';
import { type UpdateDriverInput, type Driver } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDriver = async (input: UpdateDriverInput): Promise<Driver> => {
  try {
    // Check if driver exists first
    const existingDriver = await db.select()
      .from(driversTable)
      .where(eq(driversTable.id, input.id))
      .execute();

    if (existingDriver.length === 0) {
      throw new Error(`Driver with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.license_number !== undefined) {
      updateData.license_number = input.license_number;
    }
    if (input.vehicle_make !== undefined) {
      updateData.vehicle_make = input.vehicle_make;
    }
    if (input.vehicle_model !== undefined) {
      updateData.vehicle_model = input.vehicle_model;
    }
    if (input.vehicle_license_plate !== undefined) {
      updateData.vehicle_license_plate = input.vehicle_license_plate;
    }
    if (input.availability_status !== undefined) {
      updateData.availability_status = input.availability_status;
    }

    // If no fields to update, return the existing driver
    if (Object.keys(updateData).length === 0) {
      return existingDriver[0];
    }

    // Update driver record
    const result = await db.update(driversTable)
      .set(updateData)
      .where(eq(driversTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Driver update failed:', error);
    throw error;
  }
};