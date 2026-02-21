/**
 * Backfill: generates a patient invite code for every doctor
 * that doesn't have one yet, in every clinic they belong to.
 *
 * Run with:
 *   pnpm tsx scripts/backfill-doctor-invites.ts
 */

import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const {
    doctors,
    clinicDoctors,
    inviteLinks,
    users,
} = schema;

async function main() {
    console.log("🔍 Buscando médicos sem convite de paciente...\n");

    // Fetch all clinic-doctor pairs
    const clinicDoctorRows = await db
        .select({
            doctorId: clinicDoctors.doctorId,
            clinicId: clinicDoctors.clinicId,
            doctorName: users.name,
        })
        .from(clinicDoctors)
        .innerJoin(doctors, eq(doctors.id, clinicDoctors.doctorId))
        .innerJoin(users, eq(users.id, doctors.userId))
        .where(eq(clinicDoctors.isActive, true));

    // Fetch existing doctor invite codes (doctor-specific ones)
    const existingInvites = await db
        .select({
            doctorId: inviteLinks.doctorId,
            clinicId: inviteLinks.clinicId,
        })
        .from(inviteLinks)
        .where(
            and(
                eq(inviteLinks.role, "patient"),
                eq(inviteLinks.isActive, true),
            )
        );

    // Build a set of (doctorId + clinicId) that already have invites
    const alreadyHasInvite = new Set(
        existingInvites
            .filter((r) => r.doctorId !== null)
            .map((r) => `${r.doctorId}::${r.clinicId}`)
    );

    const toCreate = clinicDoctorRows.filter(
        (r) => !alreadyHasInvite.has(`${r.doctorId}::${r.clinicId}`)
    );

    if (toCreate.length === 0) {
        console.log("✅ Todos os médicos já possuem um código de convite. Nada a fazer.");
        return;
    }

    console.log(`📋 ${toCreate.length} médico(s) precisam de código:\n`);

    for (const row of toCreate) {
        const code = crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase();
        await db.insert(inviteLinks).values({
            clinicId: row.clinicId,
            doctorId: row.doctorId,
            role: "patient",
            code,
        });
        console.log(`  ✔ ${row.doctorName?.padEnd(30)} → código: ${code}`);
    }

    console.log(`\n🎉 ${toCreate.length} código(s) gerado(s) com sucesso!`);
}

main().catch((err) => {
    console.error("❌ Erro:", err);
    process.exit(1);
});
