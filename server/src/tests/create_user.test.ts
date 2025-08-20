import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  address: '123 Main St, Anytown, ST 12345'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual(testInput.email);
    expect(result.phone).toEqual(testInput.phone);
    expect(result.address).toEqual(testInput.address);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual(testInput.email);
    expect(users[0].phone).toEqual(testInput.phone);
    expect(users[0].address).toEqual(testInput.address);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple users with unique IDs', async () => {
    const user1 = await createUser(testInput);
    
    const testInput2: CreateUserInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0456',
      address: '456 Oak Ave, Somewhere, ST 67890'
    };
    const user2 = await createUser(testInput2);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.name).toEqual('John Doe');
    expect(user2.name).toEqual('Jane Smith');
    expect(user1.email).toEqual(testInput.email);
    expect(user2.email).toEqual(testInput2.email);

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should handle different input data correctly', async () => {
    const specialInput: CreateUserInput = {
      name: 'María González-López',
      email: 'maria.gonzalez@empresa.es',
      phone: '+34-612-345-678',
      address: 'Calle Mayor 123, 28001 Madrid, España'
    };

    const result = await createUser(specialInput);

    expect(result.name).toEqual('María González-López');
    expect(result.email).toEqual('maria.gonzalez@empresa.es');
    expect(result.phone).toEqual('+34-612-345-678');
    expect(result.address).toEqual('Calle Mayor 123, 28001 Madrid, España');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual(specialInput.name);
    expect(users[0].email).toEqual(specialInput.email);
  });

  it('should create users with current timestamp', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});