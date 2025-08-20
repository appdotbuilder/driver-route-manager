import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for PostgreSQL
export const driverAvailabilityStatusEnum = pgEnum('driver_availability_status', ['available', 'unavailable']);
export const routeStatusEnum = pgEnum('route_status', ['pending', 'in_progress', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Drivers table
export const driversTable = pgTable('drivers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  license_number: text('license_number').notNull(),
  vehicle_make: text('vehicle_make').notNull(),
  vehicle_model: text('vehicle_model').notNull(),
  vehicle_license_plate: text('vehicle_license_plate').notNull(),
  availability_status: driverAvailabilityStatusEnum('availability_status').notNull().default('available'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Routes table
export const routesTable = pgTable('routes', {
  id: serial('id').primaryKey(),
  driver_id: integer('driver_id').notNull().references(() => driversTable.id),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  distance: numeric('distance', { precision: 10, scale: 2 }).notNull(), // km with 2 decimal places
  estimated_duration: integer('estimated_duration').notNull(), // minutes
  start_datetime: timestamp('start_datetime').notNull(),
  end_datetime: timestamp('end_datetime'), // Nullable - can be set when route is completed
  route_status: routeStatusEnum('route_status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const driversRelations = relations(driversTable, ({ many }) => ({
  routes: many(routesTable),
}));

export const routesRelations = relations(routesTable, ({ one }) => ({
  driver: one(driversTable, {
    fields: [routesTable.driver_id],
    references: [driversTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Driver = typeof driversTable.$inferSelect;
export type NewDriver = typeof driversTable.$inferInsert;

export type Route = typeof routesTable.$inferSelect;
export type NewRoute = typeof routesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  drivers: driversTable,
  routes: routesTable
};

export const tableRelations = {
  driversRelations,
  routesRelations
};