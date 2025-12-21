import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

import { db } from "@/server/db";

const statements = {
  ...defaultStatements,
  ...adminAc.statements,
  placement: ["create", "read", "update"],

  attendanceLog: ["create", "read", "verify"],
  assessment: ["create", "read", "update", "delete"],
  task: ["create", "read", "update", "delete", "review"],
  report: ["create", "read", "update", "review"],
  studentProfile: ["create", "read", "update"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update", "delete"],
  analytics: ["read"],
} as const;

const ac = createAccessControl(statements);

const adminRole = ac.newRole({
  ...adminAc.statements,
  placement: ["create", "read", "update"],
  attendanceLog: ["read", "verify"],
  assessment: ["create", "read", "update", "delete"],
  task: ["create", "read", "update", "delete", "review"],
  report: ["create", "read", "update", "review"],
  studentProfile: ["read"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update", "delete"],
  analytics: ["read"],
});

const mentorRole = ac.newRole({
  placement: ["read", "update"],
  attendanceLog: ["read", "verify"],
  assessment: ["create", "read", "update"],
  task: ["create", "read", "update", "review"],
  report: ["read", "review"],
  user: ["create"],
  studentProfile: ["create", "read", "update"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update"],
  analytics: ["read"],
});

const studentRole = ac.newRole({
  placement: ["read"],
  attendanceLog: ["create", "read"],
  assessment: ["read"],
  task: ["read", "update"],
  report: ["create", "read"],
  studentProfile: ["read"],
  calendarEvent: ["read"],
});

export const auth = betterAuth({
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        mentor: mentorRole,
        student: studentRole,
      },
      defaultRole: "student",
      adminRoles: ["admin"],
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      code: {
        type: "string",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
