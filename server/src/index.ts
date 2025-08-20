import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  deleteInputSchema,
  getByIdInputSchema,
  createDriverInputSchema,
  updateDriverInputSchema,
  createRouteInputSchema,
  updateRouteInputSchema,
  routeReportFilterSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createDriver } from './handlers/create_driver';
import { getDrivers } from './handlers/get_drivers';
import { getDriverById } from './handlers/get_driver_by_id';
import { updateDriver } from './handlers/update_driver';
import { deleteDriver } from './handlers/delete_driver';
import { createRoute } from './handlers/create_route';
import { getRoutes } from './handlers/get_routes';
import { getRouteById } from './handlers/get_route_by_id';
import { updateRoute } from './handlers/update_route';
import { deleteRoute } from './handlers/delete_route';
import { getRouteReport } from './handlers/get_route_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getUserById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getUserById(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Driver management routes
  createDriver: publicProcedure
    .input(createDriverInputSchema)
    .mutation(({ input }) => createDriver(input)),
  
  getDrivers: publicProcedure
    .query(() => getDrivers()),
  
  getDriverById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getDriverById(input)),
  
  updateDriver: publicProcedure
    .input(updateDriverInputSchema)
    .mutation(({ input }) => updateDriver(input)),
  
  deleteDriver: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteDriver(input)),

  // Route management routes
  createRoute: publicProcedure
    .input(createRouteInputSchema)
    .mutation(({ input }) => createRoute(input)),
  
  getRoutes: publicProcedure
    .query(() => getRoutes()),
  
  getRouteById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getRouteById(input)),
  
  updateRoute: publicProcedure
    .input(updateRouteInputSchema)
    .mutation(({ input }) => updateRoute(input)),
  
  deleteRoute: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteRoute(input)),

  // Route reporting
  getRouteReport: publicProcedure
    .input(routeReportFilterSchema)
    .query(({ input }) => getRouteReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();