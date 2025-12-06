import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { usersRouter } from "./routers/users";
import { mentorsRouter } from "./routers/mentors";
import { dashboardsRouter } from "./routers/dashboards";
import { studentsRouter } from "./routers/students";
import { reportsRouter } from "./routers/reports";
import { attendancesRouter } from "./routers/attendances";
import { calendarEventsRouter } from "./routers/calendarEvents";
import { tasksRouter } from "./routers/tasks";
import { finalReportsRouter } from "./routers/finalReports";
import { companiesRouter } from "./routers/companies";
import { assessmentsRouter } from "./routers/assessments";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  users: usersRouter,
  mentors: mentorsRouter,
  dashboards: dashboardsRouter,
  students: studentsRouter,
  reports: reportsRouter,
  attendances: attendancesRouter,
  calendarEvents: calendarEventsRouter,
  tasks: tasksRouter,
  finalReports: finalReportsRouter,
  companies: companiesRouter,
  assessments: assessmentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
