import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetByIdInput, type CreateUserInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

// Test input data
const testUserInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  address: '123 Main St, Anytown, USA'
};

const testUserInput2: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-0456',
  address: '456 Oak Ave, Somewhere, USA'
};

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when valid ID is provided', async () => {
    // Create a test user first
    const insertResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const input: GetByIdInput = { id: createdUser.id };

    // Test the handler
    const result = await getUserById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('+1-555-0123');
    expect(result!.address).toEqual('123 Main St, Anytown, USA');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user ID does not exist', async () => {
    const input: GetByIdInput = { id: 999 };

    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    const insertResult1 = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const insertResult2 = await db.insert(usersTable)
      .values(testUserInput2)
      .returning()
      .execute();

    const user1 = insertResult1[0];
    const user2 = insertResult2[0];

    // Test getting the second user
    const input: GetByIdInput = { id: user2.id };
    const result = await getUserById(input);

    // Verify we got the correct user
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(user2.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.email).toEqual('jane.smith@example.com');
    expect(result!.phone).toEqual('+1-555-0456');
    expect(result!.address).toEqual('456 Oak Ave, Somewhere, USA');
    
    // Ensure we didn't get the first user
    expect(result!.id).not.toEqual(user1.id);
    expect(result!.name).not.toEqual('John Doe');
  });

  it('should handle edge case with ID 0', async () => {
    const input: GetByIdInput = { id: 0 };

    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should handle negative ID values', async () => {
    const input: GetByIdInput = { id: -1 };

    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should verify all user fields are properly returned', async () => {
    // Create a test user
    const insertResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const input: GetByIdInput = { id: createdUser.id };

    const result = await getUserById(input);

    // Verify all expected fields are present and have correct types
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.email).toBe('string');
    expect(typeof result!.phone).toBe('string');
    expect(typeof result!.address).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify actual values match
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual(testUserInput.name);
    expect(result!.email).toEqual(testUserInput.email);
    expect(result!.phone).toEqual(testUserInput.phone);
    expect(result!.address).toEqual(testUserInput.address);
  });
});