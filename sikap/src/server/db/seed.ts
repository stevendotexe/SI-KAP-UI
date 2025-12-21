/* eslint-disable drizzle/enforce-delete-with-where */
import { type PgTable } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { auth } from "@/server/better-auth";
import * as schema from "@/server/db/schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clear Database
  console.log("🧹 Clearing existing data...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resetTable = async (table: PgTable<any>, name: string) => {
    try {
      await db.delete(table);
    } catch (error) {
      // Postgres error code for "undefined_table" is 42P01
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "42P01"
      ) {
        console.warn(`   Table ${name} does not exist, skipping...`);
      } else {
        throw error;
      }
    }
  };

  // Order matters due to foreign keys
  await resetTable(schema.taskChecklistItem, "taskChecklistItem");
  await resetTable(schema.task, "task");
  await resetTable(schema.attendanceLog, "attendanceLog");
  await resetTable(schema.report, "report");
  await resetTable(schema.finalReport, "finalReport");
  await resetTable(schema.assessmentItem, "assessmentItem");
  await resetTable(schema.assessment, "assessment");
  await resetTable(schema.calendarEvent, "calendarEvent");
  await resetTable(schema.notification, "notification");
  await resetTable(schema.attachment, "attachment");
  await resetTable(schema.placement, "placement");
  await resetTable(schema.studentProfile, "studentProfile");
  await resetTable(schema.mentorProfile, "mentorProfile");
  await resetTable(schema.company, "company");
  await resetTable(schema.program, "program");
  await resetTable(schema.session, "session");
  await resetTable(schema.account, "account");
  await resetTable(schema.user, "user");
  await resetTable(schema.verification, "verification");

  console.log("👥 Creating users...");

  const password = "password123";

  // Helper to create user
  const createUser = async (
    name: string,
    email: string,
    role: "admin" | "mentor" | "student",
  ) => {
    console.log(`   Creating ${role}: ${email}`);
    try {
      // Create user using better-auth
      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          code: `SEED-${role.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        },
      });

      let userId: string;

      if (res?.user) {
        userId = res.user.id;
      } else {
        // Fallback: check if user exists (maybe created but returned null?)
        const u = await db.query.user.findFirst({
          where: eq(schema.user.email, email),
        });
        if (!u) throw new Error(`Failed to create user ${email}`);
        userId = u.id;
      }

      // Update role manually to ensure it's correct
      await db
        .update(schema.user)
        .set({ role })
        .where(eq(schema.user.id, userId));

      // Fetch and return the updated user
      const updatedUser = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      });
      return updatedUser!;
    } catch (e) {
      console.error(`   Error creating user ${email}:`, e);
      throw e;
    }
  };

  // Create Main Accounts
  await createUser("Admin System", "admin@sikap.com", "admin");

  const mentorUser = await createUser(
    "Mentor Utama",
    "mentor@sikap.com",
    "mentor",
  );

  const studentUser = await createUser(
    "Siswa Teladan",
    "student@sikap.com",
    "student",
  );

  // 3. Create Companies
  console.log("🏢 Creating companies...");
  const companies = [];
  for (let i = 0; i < 5; i++) {
    const [c] = await db
      .insert(schema.company)
      .values({
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        latitude: String(faker.location.latitude()),
        longitude: String(faker.location.longitude()),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number(),
        website: faker.internet.url(),
      })
      .returning();
    companies.push(c);
  }

  // 4. Create Programs
  console.log("🎓 Creating programs...");
  const programs = [];
  const programNames = [
    "Magang Merdeka Batch 6",
    "Studi Independen Batch 6",
    "PKL SMK 2024",
  ];
  for (const name of programNames) {
    const [p] = await db
      .insert(schema.program)
      .values({
        name,
        description: faker.lorem.sentence(),
        startDate: faker.date.past().toISOString().split("T")[0], // Date type
        endDate: faker.date.future().toISOString().split("T")[0],
      })
      .returning();
    programs.push(p);
  }

  // 5. Create Mentor Profiles
  console.log("👨‍🏫 Creating mentor profiles...");
  const mentorUsers = [mentorUser];
  // Create 4 more mentors
  for (let i = 0; i < 4; i++) {
    mentorUsers.push(
      await createUser(
        faker.person.fullName(),
        faker.internet.email(),
        "mentor",
      ),
    );
  }

  const mentorProfiles = [];
  for (const u of mentorUsers) {
    const [mp] = await db
      .insert(schema.mentorProfile)
      .values({
        userId: u.id,
        companyId: faker.helpers.arrayElement(companies)?.id,
        phone: faker.phone.number(),
        active: true,
      })
      .returning();
    mentorProfiles.push(mp);
  }

  // 6. Create Student Profiles
  console.log("👨‍🎓 Creating student profiles...");
  const studentUsers = [studentUser];
  // Create 9 more students
  for (let i = 0; i < 9; i++) {
    studentUsers.push(
      await createUser(
        faker.person.fullName(),
        faker.internet.email(),
        "student",
      ),
    );
  }

  const studentProfiles = [];
  for (const u of studentUsers) {
    const [sp] = await db
      .insert(schema.studentProfile)
      .values({
        userId: u.id,
        school: faker.helpers.arrayElement([
          "Universitas Indonesia",
          "ITB",
          "UGM",
          "Binus",
          "SMK 1 Jakarta",
        ]),
        major: faker.helpers.arrayElement([
          "Informatika",
          "Sistem Informasi",
          "DKV",
          "Akuntansi",
        ]),
        cohort: "2024",
        phone: faker.phone.number(),
        active: true,
      })
      .returning();
    studentProfiles.push(sp);
  }

  // 7. Create Placements
  console.log("📍 Creating placements...");
  const placements = [];
  for (const sp of studentProfiles) {
    const mentor = faker.helpers.arrayElement(mentorProfiles);
    const program = faker.helpers.arrayElement(programs);

    // Ensure mentor has companyId
    if (!mentor?.companyId) continue;

    // Ensure student has programId
    if (!program?.id) continue;

    // Ensure student has userId
    if (!sp?.id) continue;

    const [pl] = await db
      .insert(schema.placement)
      .values({
        studentId: sp.id,
        mentorId: mentor.id,
        companyId: mentor.companyId,
        programId: program.id,
        startDate: faker.date.past().toISOString().split("T")[0],
        endDate: faker.date.future().toISOString().split("T")[0],
        status: "active",
      })
      .returning();
    placements.push(pl);
  }

  // 8. Create Activities for each placement
  console.log("📝 Creating activities (tasks, attendance, reports)...");
  for (const pl of placements) {
    if (
      !pl?.id ||
      !pl?.mentorId ||
      !pl?.companyId ||
      !pl?.programId ||
      !pl?.studentId
    )
      continue;
    const studentProfile = studentProfiles.find((s) => s?.id === pl.studentId);
    if (!studentProfile) continue;

    // Tasks
    const numTasks = faker.number.int({ min: 3, max: 8 });
    for (let i = 0; i < numTasks; i++) {
      const [t] = await db
        .insert(schema.task)
        .values({
          placementId: pl.id,
          title: faker.lorem.words(3),
          description: faker.lorem.paragraph(),
          dueDate: faker.date.future().toISOString().split("T")[0],
          status: faker.helpers.arrayElement([
            "todo",
            "in_progress",
            "submitted",
            "approved",
          ]),
          createdById: studentProfile.userId,
        })
        .returning();

      if (!t?.id) continue;

      // Checklist items
      const numItems = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < numItems; j++) {
        await db.insert(schema.taskChecklistItem).values({
          taskId: t.id,
          label: faker.lorem.words(4),
          isCompleted: faker.datatype.boolean(),
          position: j,
        });
      }
    }

    // Attendance
    // Better loop for attendance to avoid unique constraint violation
    const numDays = faker.number.int({ min: 5, max: 20 });
    const today = new Date();
    for (let i = 0; i < numDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr =
        d.toISOString().split("T")[0] ??
        new Date().toISOString().split("T")[0]!;

      const status = faker.helpers.arrayElement([
        "present",
        "present",
        "present",
        "late",
        "absent",
      ]) as "present" | "late" | "absent" | "excused"; // Weighted

      await db.insert(schema.attendanceLog).values({
        placementId: pl.id,
        date: dateStr,
        status,
        checkInAt:
          status === "present" || status === "late"
            ? new Date(d.setHours(8, 0, 0))
            : null,
        checkOutAt:
          status === "present" || status === "late"
            ? new Date(d.setHours(17, 0, 0))
            : null,
        latitude: String(faker.location.latitude()),
        longitude: String(faker.location.longitude()),
      });
    }

    // Reports (Daily/Weekly)
    const numReports = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < numReports; i++) {
      await db.insert(schema.report).values({
        placementId: pl.id,
        type: faker.helpers.arrayElement(["daily", "weekly"]),
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        periodStart: faker.date.recent().toISOString().split("T")[0],
        periodEnd: faker.date.recent().toISOString().split("T")[0],
        submittedAt: new Date(),
        reviewStatus: faker.helpers.arrayElement([
          "pending",
          "approved",
          "rejected",
        ]),
        score: faker.number
          .float({ min: 70, max: 100, fractionDigits: 2 })
          .toString(),
      });
    }
  }

  console.log("✅ Seeding completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
