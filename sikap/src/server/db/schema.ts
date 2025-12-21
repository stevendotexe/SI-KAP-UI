import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `${name}`);

/**
 * Enums
 */
export const userRole = pgEnum("user_role", ["admin", "mentor", "student"]);
export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
]);
export const placementStatus = pgEnum("placement_status", [
  "active",
  "completed",
  "canceled",
]);
export const attendanceStatus = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);
export const reportType = pgEnum("report_type", ["daily", "weekly", "monthly"]);
export const reviewStatus = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const competencyCategory = pgEnum("competency_category", [
  "personality",
  "technical",
]);
export const ownerTypeEnum = pgEnum("owner_type", [
  "task",
  "report",
  "final_report",
  "assessment",
  "calendar_event",
  "attendance_log",
]);
export const notificationType = pgEnum("notification_type", [
  "assignment",
  "approval",
  "reminder",
  "system",
]);
export const eventType = pgEnum("event_type", [
  "meeting",
  "deadline",
  "milestone",
  "in_class",
  "field_trip",
  "meet_greet",
]);

/**
 * User
 * Authentication user with system role.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull().default("student"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by").references(() => user.id, {
    onDelete: "cascade",
  }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  mentorProfile: many(mentorProfile),
  studentProfile: many(studentProfile),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

/**
 * Company
 */
export const company = createTable(
  "company",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.text().notNull(),
    address: d.text(),
    latitude: d.numeric({ precision: 9, scale: 6 }),
    longitude: d.numeric({ precision: 9, scale: 6 }),
    contactEmail: d.text(),
    contactPhone: d.varchar({ length: 30 }),
    website: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("company_name_idx").on(t.name)],
);

export const companyRelations = relations(company, ({ many }) => ({
  placements: many(placement),
  mentors: many(mentorProfile),
}));

/**
 * Program
 */
export const program = createTable("program", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.text().notNull(),
  description: d.text(),
  startDate: d.date(),
  endDate: d.date(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const programRelations = relations(program, ({ many }) => ({
  placements: many(placement),
}));

/**
 * MentorProfile
 */
export const mentorProfile = createTable(
  "mentor_profile",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: d.integer().references(() => company.id),
    phone: d.varchar({ length: 30 }),
    active: d.boolean().notNull().default(true),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("mentor_user_unique").on(t.userId),
    index("mentor_company_idx").on(t.companyId),
  ],
);

export const mentorProfileRelations = relations(
  mentorProfile,
  ({ one, many }) => ({
    user: one(user, { fields: [mentorProfile.userId], references: [user.id] }),
    company: one(company, {
      fields: [mentorProfile.companyId],
      references: [company.id],
    }),
    placements: many(placement),
    reviewedReports: many(report),
    approvedFinalReports: many(finalReport),
    verifiedAttendances: many(attendanceLog),
    assessments: many(assessment),
  }),
);

/**
 * StudentProfile
 */
export const studentProfile = createTable(
  "student_profile",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nis: d.text(),
    birthPlace: d.text(),
    birthDate: d.date(),
    gender: d.text(),
    semester: d.integer(),
    school: d.text(),
    major: d.text(),
    cohort: d.text(),
    address: d.text(),
    phone: d.varchar({ length: 30 }),
    active: d.boolean().notNull().default(true),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [uniqueIndex("student_user_unique").on(t.userId)],
);

export const studentProfileRelations = relations(
  studentProfile,
  ({ one, many }) => ({
    user: one(user, { fields: [studentProfile.userId], references: [user.id] }),
    placements: many(placement),
  }),
);

/**
 * Placement
 */
export const placement = createTable(
  "placement",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    studentId: d
      .integer()
      .notNull()
      .references(() => studentProfile.id, { onDelete: "cascade" }),
    mentorId: d
      .integer()
      .notNull()
      .references(() => mentorProfile.id, { onDelete: "set null" }),
    companyId: d
      .integer()
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    programId: d
      .integer()
      .references(() => program.id, { onDelete: "set null" }),
    startDate: d.date(),
    endDate: d.date(),
    status: placementStatus("status").notNull().default("active"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("placement_student_idx").on(t.studentId),
    index("placement_status_idx").on(t.status),
  ],
);

export const placementRelations = relations(placement, ({ one, many }) => ({
  student: one(studentProfile, {
    fields: [placement.studentId],
    references: [studentProfile.id],
  }),
  mentor: one(mentorProfile, {
    fields: [placement.mentorId],
    references: [mentorProfile.id],
  }),
  company: one(company, {
    fields: [placement.companyId],
    references: [company.id],
  }),
  program: one(program, {
    fields: [placement.programId],
    references: [program.id],
  }),
  tasks: many(task),
  attendanceLogs: many(attendanceLog),
  reports: many(report),
  assessments: many(assessment),
  finalReports: many(finalReport),
  events: many(calendarEvent),
}));

/**
 * Task
 */
export const task = createTable(
  "task",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    placementId: d
      .integer()
      .notNull()
      .references(() => placement.id, { onDelete: "cascade" }),
    title: d.text().notNull(),
    description: d.text(),
    dueDate: d.date(),
    status: taskStatus("status").notNull().default("todo"),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    // Submission fields
    submissionNote: d.text(),
    submittedAt: d.timestamp({ withTimezone: true }),
    targetMajor: d.text(),
    // Review fields (similar to report table)
    reviewedByMentorId: d.integer().references(() => mentorProfile.id),
    reviewNotes: d.text(),
    reviewedAt: d.timestamp({ withTimezone: true }),
    score: d.numeric({ precision: 5, scale: 2 }),
  }),
  (t) => [
    index("task_placement_status_idx").on(t.placementId, t.status),
    index("task_due_date_idx").on(t.dueDate),
  ],
);

export const taskRelations = relations(task, ({ one, many }) => ({
  placement: one(placement, {
    fields: [task.placementId],
    references: [placement.id],
  }),
  checklistItems: many(taskChecklistItem),
  reviewedBy: one(mentorProfile, {
    fields: [task.reviewedByMentorId],
    references: [mentorProfile.id],
  }),
}));

/**
 * TaskChecklistItem
 */
export const taskChecklistItem = createTable(
  "task_checklist_item",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    taskId: d
      .integer()
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    label: d.text().notNull(),
    isCompleted: d.boolean().notNull().default(false),
    position: d.integer(),
  }),
  (t) => [index("checklist_task_idx").on(t.taskId)],
);

export const taskChecklistItemRelations = relations(
  taskChecklistItem,
  ({ one }) => ({
    task: one(task, {
      fields: [taskChecklistItem.taskId],
      references: [task.id],
    }),
  }),
);

/**
 * AttendanceLog
 */
export const attendanceLog = createTable(
  "attendance_log",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    placementId: d
      .integer()
      .notNull()
      .references(() => placement.id, { onDelete: "cascade" }),
    date: d.date().notNull(),
    checkInAt: d.timestamp({ withTimezone: true }),
    checkOutAt: d.timestamp({ withTimezone: true }),
    status: attendanceStatus("status").notNull().default("present"),
    latitude: d.numeric({ precision: 9, scale: 6 }),
    longitude: d.numeric({ precision: 9, scale: 6 }),
    locationNote: d.text(),
    verifiedByMentorId: d
      .integer()
      .references(() => mentorProfile.id, { onDelete: "set null" }),
    verifiedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("attendance_unique_per_day").on(t.placementId, t.date),
    index("attendance_status_idx").on(t.status),
  ],
);

export const attendanceLogRelations = relations(attendanceLog, ({ one }) => ({
  placement: one(placement, {
    fields: [attendanceLog.placementId],
    references: [placement.id],
  }),
  verifiedBy: one(mentorProfile, {
    fields: [attendanceLog.verifiedByMentorId],
    references: [mentorProfile.id],
  }),
}));

/**
 * Report
 */
export const report = createTable(
  "report",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    placementId: d
      .integer()
      .notNull()
      .references(() => placement.id, { onDelete: "cascade" }),
    type: reportType("type").notNull(),
    title: d.text(),
    content: d.text(),
    periodStart: d.date(),
    periodEnd: d.date(),
    submittedAt: d.timestamp({ withTimezone: true }),
    reviewedByMentorId: d.integer().references(() => mentorProfile.id),
    reviewStatus: reviewStatus("review_status").notNull().default("pending"),
    reviewNotes: d.text(),
    reviewedAt: d.timestamp({ withTimezone: true }),
    score: d.numeric({ precision: 5, scale: 2 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("report_type_idx").on(t.type),
    index("report_placement_idx").on(t.placementId),
  ],
);

export const reportRelations = relations(report, ({ one }) => ({
  placement: one(placement, {
    fields: [report.placementId],
    references: [placement.id],
  }),
  reviewedBy: one(mentorProfile, {
    fields: [report.reviewedByMentorId],
    references: [mentorProfile.id],
  }),
}));

/**
 * FinalReport
 */
export const finalReport = createTable("final_report", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  placementId: d
    .integer()
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  title: d.text(),
  content: d.text(),
  submittedAt: d.timestamp({ withTimezone: true }),
  approvedByMentorId: d.integer().references(() => mentorProfile.id),
  approvedAt: d.timestamp({ withTimezone: true }),
  grade: d.text(),
  totalScore: d.numeric({ precision: 10, scale: 2 }),
  averageScore: d.numeric({ precision: 5, scale: 2 }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const finalReportRelations = relations(finalReport, ({ one }) => ({
  placement: one(placement, {
    fields: [finalReport.placementId],
    references: [placement.id],
  }),
  approvedBy: one(mentorProfile, {
    fields: [finalReport.approvedByMentorId],
    references: [mentorProfile.id],
  }),
}));

export const competencyTemplate = createTable("competency_template", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.text().notNull(),
  category: competencyCategory("category").notNull(),
  major: d.text().notNull(), // contoh: "RPL" atau "TKJ"
  weight: d.numeric({ precision: 5, scale: 2 }),
  position: d.integer(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const finalReportScore = createTable("final_report_score", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  finalReportId: d
    .integer()
    .notNull()
    .references(() => finalReport.id, { onDelete: "cascade" }),
  competencyTemplateId: d
    .integer()
    .notNull()
    .references(() => competencyTemplate.id, { onDelete: "cascade" }),
  score: d.numeric({ precision: 5, scale: 2 }),
}));

export const finalReportScoreRelations = relations(
  finalReportScore,
  ({ one }) => ({
    finalReport: one(finalReport, {
      fields: [finalReportScore.finalReportId],
      references: [finalReport.id],
    }),
    competency: one(competencyTemplate, {
      fields: [finalReportScore.competencyTemplateId],
      references: [competencyTemplate.id],
    }),
  }),
);

/**
 * Assessment
 */
export const assessment = createTable("assessment", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  placementId: d
    .integer()
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  evaluatorMentorId: d.integer().references(() => mentorProfile.id),
  comments: d.text(),
  totalScore: d.numeric({ precision: 5, scale: 2 }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  placement: one(placement, {
    fields: [assessment.placementId],
    references: [placement.id],
  }),
  evaluator: one(mentorProfile, {
    fields: [assessment.evaluatorMentorId],
    references: [mentorProfile.id],
  }),
  items: many(assessmentItem),
}));

/**
 * AssessmentItem
 */
export const assessmentItem = createTable("assessment_item", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  assessmentId: d
    .integer()
    .notNull()
    .references(() => assessment.id, { onDelete: "cascade" }),
  criterion: d.text().notNull(),
  maxScore: d.numeric({ precision: 5, scale: 2 }),
  score: d.numeric({ precision: 5, scale: 2 }),
  comments: d.text(),
  position: d.integer(),
}));

export const assessmentItemRelations = relations(assessmentItem, ({ one }) => ({
  assessment: one(assessment, {
    fields: [assessmentItem.assessmentId],
    references: [assessment.id],
  }),
}));

/**
 * TaskCompetencyImpact
 */
export const taskCompetencyImpact = createTable(
  "task_competency_impact",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    taskId: d
      .integer()
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    competencyTemplateId: d
      .integer()
      .notNull()
      .references(() => competencyTemplate.id, { onDelete: "cascade" }),
  }),
);

export const taskCompetencyImpactRelations = relations(
  taskCompetencyImpact,
  ({ one }) => ({
    task: one(task, {
      fields: [taskCompetencyImpact.taskId],
      references: [task.id],
    }),
    competency: one(competencyTemplate, {
      fields: [taskCompetencyImpact.competencyTemplateId],
      references: [competencyTemplate.id],
    }),
  }),
);

/**
 * Attachment
 */
export const attachment = createTable(
  "attachment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    ownerType: ownerTypeEnum("owner_type").notNull(),
    ownerId: d.integer().notNull(),
    url: d.text().notNull(),
    filename: d.text(),
    mimeType: d.text(),
    sizeBytes: d.integer(),
    createdById: d.varchar({ length: 255 }).references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("attachment_owner_idx").on(t.ownerType, t.ownerId)],
);

export const attachmentRelations = relations(attachment, ({ one }) => ({
  createdBy: one(user, {
    fields: [attachment.createdById],
    references: [user.id],
  }),
}));

/**
 * Notification
 */
export const notification = createTable(
  "notification",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    title: d.text().notNull(),
    body: d.text(),
    isRead: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("notification_user_idx").on(t.userId),
    index("notification_read_idx").on(t.isRead),
  ],
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

/**
 * CalendarEvent
 */
export const calendarEvent = createTable("calendar_event", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  placementId: d
    .integer()
    .references(() => placement.id, { onDelete: "set null" }),
  type: eventType("type").notNull(),
  title: d.text().notNull(),
  description: d.text(),
  scheduledAt: d.timestamp({ withTimezone: true }).notNull(),
  endDate: d.timestamp({ withTimezone: true }),
  location: d.text(),
  organizerName: d.text(),
  organizerLogoUrl: d.text(),
  colorHex: d.varchar({ length: 16 }),
  createdById: d.varchar({ length: 255 }).references(() => user.id),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const calendarEventRelations = relations(calendarEvent, ({ one }) => ({
  placement: one(placement, {
    fields: [calendarEvent.placementId],
    references: [placement.id],
  }),
  createdBy: one(user, {
    fields: [calendarEvent.createdById],
    references: [user.id],
  }),
}));

/**
 * Types
 */
export type User = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;
export type MentorProfile = typeof mentorProfile.$inferSelect;
export type MentorProfileInsert = typeof mentorProfile.$inferInsert;
export type StudentProfile = typeof studentProfile.$inferSelect;
export type StudentProfileInsert = typeof studentProfile.$inferInsert;
export type Company = typeof company.$inferSelect;
export type CompanyInsert = typeof company.$inferInsert;
export type Program = typeof program.$inferSelect;
export type ProgramInsert = typeof program.$inferInsert;
export type Placement = typeof placement.$inferSelect;
export type PlacementInsert = typeof placement.$inferInsert;
export type Task = typeof task.$inferSelect;
export type TaskInsert = typeof task.$inferInsert;
export type TaskChecklistItem = typeof taskChecklistItem.$inferSelect;
export type TaskChecklistItemInsert = typeof taskChecklistItem.$inferInsert;
export type AttendanceLog = typeof attendanceLog.$inferSelect;
export type AttendanceLogInsert = typeof attendanceLog.$inferInsert;
export type Report = typeof report.$inferSelect;
export type ReportInsert = typeof report.$inferInsert;
export type FinalReport = typeof finalReport.$inferSelect;
export type FinalReportInsert = typeof finalReport.$inferInsert;
export type Assessment = typeof assessment.$inferSelect;
export type AssessmentInsert = typeof assessment.$inferInsert;
export type AssessmentItem = typeof assessmentItem.$inferSelect;
export type AssessmentItemInsert = typeof assessmentItem.$inferInsert;
export type Attachment = typeof attachment.$inferSelect;
export type AttachmentInsert = typeof attachment.$inferInsert;
export type CompetencyTemplate = typeof competencyTemplate.$inferSelect;
export type CompetencyTemplateInsert = typeof competencyTemplate.$inferInsert;
export type FinalReportScore = typeof finalReportScore.$inferSelect;
export type FinalReportScoreInsert = typeof finalReportScore.$inferInsert;
export type TaskCompetencyImpact = typeof taskCompetencyImpact.$inferSelect;
export type TaskCompetencyImpactInsert =
  typeof taskCompetencyImpact.$inferInsert;
export type Notification = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;
export type CalendarEvent = typeof calendarEvent.$inferSelect;
export type CalendarEventInsert = typeof calendarEvent.$inferInsert;
