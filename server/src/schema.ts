import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Driver availability status enum
export const driverAvailabilityStatusEnum = z.enum(["available", "unavailable"]);

// Driver schema
export const driverSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  license_number: z.string(),
  vehicle_make: z.string(),
  vehicle_model: z.string(),
  vehicle_license_plate: z.string(),
  availability_status: driverAvailabilityStatusEnum,
  created_at: z.coerce.date()
});

export type Driver = z.infer<typeof driverSchema>;

// Input schema for creating drivers
export const createDriverInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  license_number: z.string().min(1, "License number is required"),
  vehicle_make: z.string().min(1, "Vehicle make is required"),
  vehicle_model: z.string().min(1, "Vehicle model is required"),
  vehicle_license_plate: z.string().min(1, "Vehicle license plate is required"),
  availability_status: driverAvailabilityStatusEnum.default("available")
});

export type CreateDriverInput = z.infer<typeof createDriverInputSchema>;

// Input schema for updating drivers
export const updateDriverInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  license_number: z.string().min(1).optional(),
  vehicle_make: z.string().min(1).optional(),
  vehicle_model: z.string().min(1).optional(),
  vehicle_license_plate: z.string().min(1).optional(),
  availability_status: driverAvailabilityStatusEnum.optional()
});

export type UpdateDriverInput = z.infer<typeof updateDriverInputSchema>;

// Route status enum
export const routeStatusEnum = z.enum(["pending", "in_progress", "completed", "cancelled"]);

// Route schema
export const routeSchema = z.object({
  id: z.number(),
  driver_id: z.number(),
  origin: z.string(),
  destination: z.string(),
  distance: z.number(), // in km
  estimated_duration: z.number().int(), // in minutes
  start_datetime: z.coerce.date(),
  end_datetime: z.coerce.date().nullable(),
  route_status: routeStatusEnum,
  created_at: z.coerce.date()
});

export type Route = z.infer<typeof routeSchema>;

// Route with driver information (for joined queries)
export const routeWithDriverSchema = z.object({
  id: z.number(),
  driver_id: z.number(),
  origin: z.string(),
  destination: z.string(),
  distance: z.number(),
  estimated_duration: z.number().int(),
  start_datetime: z.coerce.date(),
  end_datetime: z.coerce.date().nullable(),
  route_status: routeStatusEnum,
  created_at: z.coerce.date(),
  driver: driverSchema
});

export type RouteWithDriver = z.infer<typeof routeWithDriverSchema>;

// Input schema for creating routes
export const createRouteInputSchema = z.object({
  driver_id: z.number(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  distance: z.number().positive("Distance must be positive"),
  estimated_duration: z.number().int().positive("Estimated duration must be positive"),
  start_datetime: z.coerce.date(),
  end_datetime: z.coerce.date().nullable().optional(),
  route_status: routeStatusEnum.default("pending")
});

export type CreateRouteInput = z.infer<typeof createRouteInputSchema>;

// Input schema for updating routes
export const updateRouteInputSchema = z.object({
  id: z.number(),
  driver_id: z.number().optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  distance: z.number().positive().optional(),
  estimated_duration: z.number().int().positive().optional(),
  start_datetime: z.coerce.date().optional(),
  end_datetime: z.coerce.date().nullable().optional(),
  route_status: routeStatusEnum.optional()
});

export type UpdateRouteInput = z.infer<typeof updateRouteInputSchema>;

// Route report filter schema
export const routeReportFilterSchema = z.object({
  driver_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  route_status: routeStatusEnum.optional()
});

export type RouteReportFilter = z.infer<typeof routeReportFilterSchema>;

// Route report summary schema
export const routeReportSummarySchema = z.object({
  total_routes: z.number().int(),
  completed_routes: z.number().int(),
  pending_routes: z.number().int(),
  in_progress_routes: z.number().int(),
  cancelled_routes: z.number().int(),
  total_distance: z.number(),
  total_duration: z.number().int(),
  routes: z.array(routeWithDriverSchema)
});

export type RouteReportSummary = z.infer<typeof routeReportSummarySchema>;

// Generic delete input schema
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

// Generic get by ID input schema
export const getByIdInputSchema = z.object({
  id: z.number()
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;