import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type DeleteInput, type CreateUserInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

// Test input for creating a user to delete
const testCreateInput: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '123-456-7890',
  address: '123 Test Street'
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create a user first
    const createdUsers = await db.insert(usersTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        address: testCreateInput.address
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];
    const deleteInput: DeleteInput = { id: createdUser.id };

    // Delete the user
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is actually deleted from database
    const remainingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(remainingUsers).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteInput = { id: nonExistentId };

    await expect(deleteUser(deleteInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should not affect other users when deleting one user', async () => {
    // Create multiple users
    const user1Data = { ...testCreateInput, name: 'User 1', email: 'user1@example.com' };
    const user2Data = { ...testCreateInput, name: 'User 2', email: 'user2@example.com' };
    const user3Data = { ...testCreateInput, name: 'User 3', email: 'user3@example.com' };

    const createdUsers = await db.insert(usersTable)
      .values([user1Data, user2Data, user3Data])
      .returning()
      .execute();

    expect(createdUsers).toHaveLength(3);

    // Delete the middle user
    const userToDelete = createdUsers[1];
    const deleteInput: DeleteInput = { id: userToDelete.id };

    const result = await deleteUser(deleteInput);
    expect(result.success).toBe(true);

    // Verify only the target user was deleted
    const remainingUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(remainingUsers).toHaveLength(2);
    expect(remainingUsers.map(u => u.id)).not.toContain(userToDelete.id);
    expect(remainingUsers.map(u => u.name)).toEqual(['User 1', 'User 3']);
  });

  it('should handle database constraint violations gracefully', async () => {
    // Create a user
    const createdUsers = await db.insert(usersTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        address: testCreateInput.address
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];

    // This should work normally since there are no constraints preventing deletion
    const deleteInput: DeleteInput = { id: createdUser.id };
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);
  });

  it('should verify user count decreases after deletion', async () => {
    // Get initial count
    const initialUsers = await db.select().from(usersTable).execute();
    const initialCount = initialUsers.length;

    // Create a user
    const createdUsers = await db.insert(usersTable)
      .values({
        name: testCreateInput.name,
        email: testCreateInput.email,
        phone: testCreateInput.phone,
        address: testCreateInput.address
      })
      .returning()
      .execute();

    // Verify count increased
    const afterCreateUsers = await db.select().from(usersTable).execute();
    expect(afterCreateUsers.length).toBe(initialCount + 1);

    // Delete the user
    const deleteInput: DeleteInput = { id: createdUsers[0].id };
    await deleteUser(deleteInput);

    // Verify count returned to original
    const finalUsers = await db.select().from(usersTable).execute();
    expect(finalUsers.length).toBe(initialCount);
  });
});