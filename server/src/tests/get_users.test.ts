import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUser1: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State'
};

const testUser2: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+9876543210',
  address: '456 Oak Ave, City, State'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users when users exist', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([testUser1, testUser2])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].address).toEqual('123 Main St, City, State');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane.smith@example.com');
    expect(result[1].phone).toEqual('+9876543210');
    expect(result[1].address).toEqual('456 Oak Ave, City, State');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users in correct order', async () => {
    // Insert users in specific order
    await db.insert(usersTable)
      .values(testUser1)
      .execute();

    await db.insert(usersTable)
      .values(testUser2)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    // Users should be returned in the order they were inserted (by id)
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should return single user correctly', async () => {
    // Create only one user
    await db.insert(usersTable)
      .values(testUser1)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].address).toEqual('123 Main St, City, State');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple users with different data correctly', async () => {
    // Create users with varied data
    const users = [
      {
        name: 'Alice Johnson',
        email: 'alice@test.com',
        phone: '555-0001',
        address: '789 Elm St'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@test.com',
        phone: '555-0002',
        address: '321 Pine St'
      },
      {
        name: 'Carol Davis',
        email: 'carol@test.com',
        phone: '555-0003',
        address: '654 Maple Ave'
      }
    ];

    await db.insert(usersTable)
      .values(users)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned with correct data
    const names = result.map(user => user.name);
    expect(names).toContain('Alice Johnson');
    expect(names).toContain('Bob Wilson');
    expect(names).toContain('Carol Davis');

    // Verify each user has all required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.phone).toBeDefined();
      expect(user.address).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });
});