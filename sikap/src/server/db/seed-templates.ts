
import { db } from "@/server/db";
import { competencyTemplate } from "@/server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding Competency Templates...");

    const templates = [
        // Personality (Same for all majors)
        { category: "personality", name: "Disiplin", major: "GENERAL", weight: 20 },
        { category: "personality", name: "Kerja Sama", major: "GENERAL", weight: 20 },
        { category: "personality", name: "Inisiatif", major: "GENERAL", weight: 20 },
        { category: "personality", name: "Tanggung Jawab", major: "GENERAL", weight: 20 },
        { category: "personality", name: "Kerajinan", major: "GENERAL", weight: 20 },

        // Technical - TKJ
        { category: "technical", name: "Penerapan K3LH", major: "TKJ", weight: 10 },
        { category: "technical", name: "Merakit Komputer", major: "TKJ", weight: 15 },
        { category: "technical", name: "Instalasi Sistem Operasi", major: "TKJ", weight: 15 },
        { category: "technical", name: "Instalasi Jaringan Lokal (LAN)", major: "TKJ", weight: 20 },
        { category: "technical", name: "Konfigurasi Routing", major: "TKJ", weight: 20 },
        { category: "technical", name: "Perbaikan Periferal", major: "TKJ", weight: 20 },

        // Technical - RPL
        { category: "technical", name: "Pemrograman Dasar", major: "RPL", weight: 15 },
        { category: "technical", name: "Basis Data", major: "RPL", weight: 15 },
        { category: "technical", name: "Pemrograman Berorientasi Objek", major: "RPL", weight: 20 },
        { category: "technical", name: "Pemrograman Web Dinamis", major: "RPL", weight: 25 },
        { category: "technical", name: "Desain Grafis / UI UX", major: "RPL", weight: 25 },
    ];

    console.log(`Checking ${templates.length} templates...`);

    for (const [index, t] of templates.entries()) {
        const existing = await db.query.competencyTemplate.findFirst({
            where: (table, { and, eq, isNull }) =>
                and(
                    eq(table.name, t.name),
                    eq(table.category, t.category as any),
                    t.major ? eq(table.major, t.major) : eq(table.major, "GENERAL")
                )
        });

        if (!existing) {
            console.log(`   + Adding: [${t.category}] ${t.name} (${t.major ?? "General"})`);
            await db.insert(competencyTemplate).values({
                category: t.category as any,
                name: t.name,
                major: t.major ?? "GENERAL",
                weight: t.weight.toString(),
                position: index,
            });
        }
    }

    console.log("✅ Competency Templates seeded!");
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
