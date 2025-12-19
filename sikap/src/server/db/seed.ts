/* eslint-disable drizzle/enforce-delete-with-where */
import { type PgTable } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { auth } from "@/server/better-auth";
import * as schema from "@/server/db/schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { generateUserCode } from "./utils";
import { STUDENTS, TASKS } from "@/lib/reports-data";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clear Database
  console.log("🧹 Clearing existing data...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resetTable = async (table: PgTable<any>, name: string) => {
    try {
      await db.delete(table);
    } catch (error) {
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
      const code = await generateUserCode(role);
      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          code,
        } as any,
      });

      let userId: string;

      if (res?.user) {
        userId = res.user.id;
      } else {
        const u = await db.query.user.findFirst({
          where: eq(schema.user.email, email),
        });
        if (!u) throw new Error(`Failed to create user ${email}`);
        userId = u.id;
      }

      await db
        .update(schema.user)
        .set({ role })
        .where(eq(schema.user.id, userId));

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

  // Mentors
  console.log("👨‍🏫 Creating mentors...");
  const mentorUsers = [
    await createUser("Mentor Utama", "mentor@sikap.com", "mentor"),
  ];
  for (let i = 0; i < 4; i++) {
    mentorUsers.push(
      await createUser(
        faker.person.fullName(),
        faker.internet.email(),
        "mentor",
      ),
    );
  }

  // Companies & Programs
  console.log("🏢 Creating companies & programs...");
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
        startDate: faker.date.past().toISOString().split("T")[0],
        endDate: faker.date.future().toISOString().split("T")[0],
      })
      .returning();
    programs.push(p);
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

  // Students from reports-data
  console.log("👨‍🎓 Creating student profiles from static data...");
  const studentProfiles = [];

  await createUser("Student Utama", "student@sikap.com", "student");
  for (const s of STUDENTS) {
    const email = `${s.student.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const u = await createUser(s.student, email, "student");

    const [sp] = await db
      .insert(schema.studentProfile)
      .values({
        userId: u.id,
        school: s.school,
        major: s.major,
        cohort: String(s.batch),
        phone: faker.phone.number(),
        active: s.state === "Aktif",
      })
      .returning();
    studentProfiles.push(sp);
  }

  // Placements
  console.log("📍 Creating placements...");
  const placements = [];
  for (const sp of studentProfiles) {
    const mentor = faker.helpers.arrayElement(mentorProfiles);
    const program = faker.helpers.arrayElement(programs);
    if (!mentor?.companyId || !program?.id || !sp?.id) continue;

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

  // Activities
  console.log(
    "📝 Creating activities (tasks, attendance, reports) with realistic status...",
  );
  for (let i = 0; i < placements.length; i++) {
    const pl = placements[i]!;
    if (!pl?.id || !pl?.studentId) continue;

    const sp = studentProfiles.find((s) => s?.id === pl.studentId);
    if (!sp) continue;

    // Tasks from TASKS
    for (let j = 0; j < TASKS.length; j++) {
      const tData = TASKS[j]!;
      const mod = (i + j) % 3;
      const status = mod === 0 ? "todo" : mod === 1 ? "submitted" : "approved";

      const [t] = await db
        .insert(schema.task)
        .values({
          placementId: pl.id,
          title: tData.title,
          description: tData.description,
          dueDate: tData.deadline,
          status: status as any,
          createdById: sp.userId,
        })
        .returning();

      if (t?.id) {
        // Sample checklist
        await db.insert(schema.taskChecklistItem).values({
          taskId: t.id,
          label: "Persiapan dokumen pendukung",
          isCompleted: status === "approved",
          position: 0,
        });
      }
    }

    // Attendance
    const numDays = 15;
    const today = new Date();
    for (let k = 0; k < numDays; k++) {
      const d = new Date(today);
      d.setDate(d.getDate() - k);
      const dateStr = d.toISOString().split("T")[0]!;

      await db.insert(schema.attendanceLog).values({
        placementId: pl.id,
        date: dateStr,
        status: faker.helpers.arrayElement([
          "present",
          "present",
          "late",
          "absent",
        ]),
        checkInAt: new Date(d.setHours(8, 0, 0)),
        checkOutAt: new Date(d.setHours(17, 0, 0)),
        latitude: String(faker.location.latitude()),
        longitude: String(faker.location.longitude()),
      });
    }

    // Final Report for random students
    if (faker.datatype.boolean(0.3)) {
      await db.insert(schema.report).values({
        placementId: pl.id,
        type: "weekly",
        title: "Laporan Mingguan Komprehensif",
        content: faker.lorem.paragraphs(2),
        submittedAt: new Date(),
        reviewStatus: "approved",
        score: "95.50",
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
