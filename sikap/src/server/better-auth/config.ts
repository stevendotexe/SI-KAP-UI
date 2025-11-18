import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

import { db } from "@/server/db";

const statements = {
  ...defaultStatements,
  placement: ["create", "read", "update"],
  attendance: ["create", "read", "verify"],
  task: ["create", "read", "update", "delete", "review"],
  report: ["create", "read", "update", "review"],
  studentProfile: ["read"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statements);

const adminRole = ac.newRole({
  ...adminAc.statements,
  placement: ["create", "read", "update"],
  attendance: ["read", "verify"],
  task: ["create", "read", "update", "delete", "review"],
  report: ["create", "read", "update", "review"],
  studentProfile: ["read"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update", "delete"],
});

const mentorRole = ac.newRole({
  placement: ["read", "update"],
  attendance: ["read", "verify"],
  task: ["create", "read", "update", "review"],
  report: ["read", "review"],
  studentProfile: ["read"],
  mentorProfile: ["read", "update"],
  calendarEvent: ["create", "read", "update"],
});

const studentRole = ac.newRole({
  placement: ["read"],
  attendance: ["create", "read"],
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
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
