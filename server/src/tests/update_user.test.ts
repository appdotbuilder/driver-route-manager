import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test user data
const testCreateUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  address: '123 Main St'
};

const testUpdateInput: UpdateUserInput = {
  id: 1, // Will be set to actual ID after creating user
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-5678',
  address: '456 Oak Ave'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all user fields', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values(testCreateUser)
      .returning()
      .execute();
    
    const createdUser = createdUsers[0];

    // Update the user
    const updateInput = { ...testUpdateInput, id: createdUser.id };
    const result = await updateUser(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane@example.com');
    expect(result.phone).toEqual('555-5678');
    expect(result.address).toEqual('456 Oak Ave');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdUser.created_at); // Should preserve original timestamp
  });

  it('should update only provided fields', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values(testCreateUser)
      .returning()
      .execute();
    
    const createdUser = createdUsers[0];

    // Update only name and email
    const partialUpdate: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const result = await updateUser(partialUpdate);

    // Verify only specified fields are updated
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual(testCreateUser.phone); // Should remain unchanged
    expect(result.address).toEqual(testCreateUser.address); // Should remain unchanged
    expect(result.created_at).toEqual(createdUser.created_at);
  });

  it('should update user in database', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values(testCreateUser)
      .returning()
      .execute();
    
    const createdUser = createdUsers[0];

    // Update the user
    const updateInput = { ...testUpdateInput, id: createdUser.id };
    await updateUser(updateInput);

    // Verify the update persisted in database
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    const updatedUser = updatedUsers[0];
    expect(updatedUser.name).toEqual('Jane Smith');
    expect(updatedUser.email).toEqual('jane@example.com');
    expect(updatedUser.phone).toEqual('555-5678');
    expect(updatedUser.address).toEqual('456 Oak Ave');
    expect(updatedUser.created_at).toEqual(createdUser.created_at);
  });

  it('should return existing user when no fields provided', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values(testCreateUser)
      .returning()
      .execute();
    
    const createdUser = createdUsers[0];

    // Update with only ID (no other fields)
    const emptyUpdate: UpdateUserInput = {
      id: createdUser.id
    };

    const result = await updateUser(emptyUpdate);

    // Should return unchanged user
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual(testCreateUser.name);
    expect(result.email).toEqual(testCreateUser.email);
    expect(result.phone).toEqual(testCreateUser.phone);
    expect(result.address).toEqual(testCreateUser.address);
    expect(result.created_at).toEqual(createdUser.created_at);
  });

  it('should throw error when user not found', async () => {
    const nonExistentUpdate: UpdateUserInput = {
      id: 99999,
      name: 'Non Existent User'
    };

    await expect(updateUser(nonExistentUpdate)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle single field updates correctly', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values(testCreateUser)
      .returning()
      .execute();
    
    const createdUser = createdUsers[0];

    // Test updating just the name
    const nameUpdate: UpdateUserInput = {
      id: createdUser.id,
      name: 'Only Name Changed'
    };

    const result = await updateUser(nameUpdate);

    expect(result.name).toEqual('Only Name Changed');
    expect(result.email).toEqual(testCreateUser.email); // Unchanged
    expect(result.phone).toEqual(testCreateUser.phone); // Unchanged
    expect(result.address).toEqual(testCreateUser.address); // Unchanged

    // Test updating just the phone
    const phoneUpdate: UpdateUserInput = {
      id: createdUser.id,
      phone: '999-0000'
    };

    const result2 = await updateUser(phoneUpdate);

    expect(result2.name).toEqual('Only Name Changed'); // From previous update
    expect(result2.phone).toEqual('999-0000'); // New value
    expect(result2.email).toEqual(testCreateUser.email); // Still unchanged
    expect(result2.address).toEqual(testCreateUser.address); // Still unchanged
  });
});