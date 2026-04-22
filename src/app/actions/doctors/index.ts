"use server";

import { auth } from "@/auth";
import { deleteDoctor, createDoctor, updateDoctor } from "@/services/doctors";
import { z } from "zod";
import {
    createDoctorSchema,
    updateDoctorSchema,
    type UpdateDoctorInput,
} from "@/validations/doctor";
import { revalidatePath } from "next/cache";
import { adminSetDoctorPasswordSchema } from "@/validations/auth";
import { adminSetDoctorPassword } from "@/services/auth";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getDoctorsSimple } from "@/db/queries/doctors";
import {
    assignPatientReferralToDoctor,
    removePatientReferralFromDoctor,
} from "@/services/patients";

export async function createDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const intent = formData.get("intent") as "create" | "reactivate" | "import" | null || "create";
    const globalId = formData.get("globalId") as string | null;

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const healthInsuranceIdsRaw = formData.getAll("healthInsuranceIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
        healthInsuranceIds: healthInsuranceIdsRaw,
    };

    // se for import/reactivate, senha não é necessária no data payload de create (vazios permitidos)
    const createDoctorPayload: Record<string, FormDataEntryValue | FormDataEntryValue[]> = { ...data };

    if (intent !== "create") {
        delete createDoctorPayload.password;
    }

    const parsed = createDoctorSchema.safeParse(createDoctorPayload);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    if (intent === "create" && !parsed.data.password) {
        return { error: "Senha é obrigatória para novo cadastro." };
    }

    if (intent === "reactivate" && globalId) {
        const updatePayload: UpdateDoctorInput = { ...parsed.data, id: globalId };
        const result = await updateDoctor(updatePayload, clinicId);
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicDoctors } = await import("@/db/schema");
            const { eq, and } = await import("drizzle-orm");
            await db.update(clinicDoctors).set({ isActive: true }).where(
                and(
                    eq(clinicDoctors.doctorId, globalId),
                    eq(clinicDoctors.clinicId, clinicId)
                )
            );
            const { ensureDoctorPatientInviteCode } = await import("@/services/invites");
            await ensureDoctorPatientInviteCode(clinicId, globalId);
            revalidatePath("/doctors");
            return { success: true, doctor: result.doctor };
        }
        return { error: result.error };
    }

    if (intent === "import" && globalId) {
        // Update global details
        const updatePayload: UpdateDoctorInput = { ...parsed.data, id: globalId };
        const result = await updateDoctor(updatePayload, clinicId);
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicDoctors } = await import("@/db/schema");
            await db.insert(clinicDoctors).values({
                doctorId: globalId,
                clinicId: clinicId,
                relationshipType: parsed.data.relationshipType,
            });
            const { ensureDoctorPatientInviteCode } = await import("@/services/invites");
            await ensureDoctorPatientInviteCode(clinicId, globalId);
            revalidatePath("/doctors");
            return { success: true, doctor: result.doctor };
        }
        return { error: result.error };
    }

    const result = await createDoctor(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true, doctor: result.doctor };
}

export async function deleteDoctorAction(doctorId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const result = await deleteDoctor(doctorId, clinicId);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}

export async function updateDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const healthInsuranceIdsRaw = formData.getAll("healthInsuranceIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
        healthInsuranceIds: healthInsuranceIdsRaw,
    };

    const parsed = updateDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await updateDoctor(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true, doctor: result.doctor };
}

export async function updateDoctorRelationshipTypeAction(
    doctorId: string,
    relationshipType: "linked" | "partner"
) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const { db } = await import("@/db");
    const { clinicDoctors } = await import("@/db/schema");
    const { and, eq } = await import("drizzle-orm");

    await db
        .update(clinicDoctors)
        .set({ relationshipType })
        .where(
            and(
                eq(clinicDoctors.doctorId, doctorId),
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        );

    revalidatePath("/doctors");
    revalidatePath("/patients");
    return { success: true };
}

export async function associateDoctorToClinicAction(
    doctorId: string,
    relationshipType: "linked" | "partner"
) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const { db } = await import("@/db");
    const { clinicDoctors } = await import("@/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const existingAssociation = await db.query.clinicDoctors.findFirst({
        where: and(
            eq(clinicDoctors.doctorId, doctorId),
            eq(clinicDoctors.clinicId, clinicId)
        ),
    });

    if (existingAssociation) {
        await db
            .update(clinicDoctors)
            .set({
                isActive: true,
                relationshipType,
            })
            .where(eq(clinicDoctors.id, existingAssociation.id));
    } else {
        await db.insert(clinicDoctors).values({
            doctorId,
            clinicId,
            relationshipType,
        });
    }

    const { ensureDoctorPatientInviteCode } = await import("@/services/invites");
    await ensureDoctorPatientInviteCode(clinicId, doctorId);

    revalidatePath("/doctors");
    revalidatePath("/patients");
    return { success: true };
}

export async function setDoctorPasswordAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId || session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const parsed = adminSetDoctorPasswordSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await adminSetDoctorPassword(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}

export async function getDoctorReferralPatientOptionsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const patients = await getPatientsByClinic(clinicId);
    return {
        success: true as const,
        patients: patients.map((patient) => ({
            id: patient.id,
            name: patient.name,
            cpf: patient.cpf,
        })),
    };
}

export async function getDoctorReferralDoctorOptionsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const doctors = await getDoctorsSimple(clinicId);
    return {
        success: true as const,
        doctors: doctors.map((doctor) => ({
            id: doctor.id,
            name: doctor.name,
            relationshipType: doctor.relationshipType,
        })),
    };
}

const assignPatientReferralSchema = z.object({
    doctorId: z.string().uuid("Médico inválido"),
    patientId: z.string().uuid("Paciente inválido"),
    referralSource: z.enum(["patient_reported", "doctor_reported", "invite_link", "manual"]),
    referralNotes: z.string().trim().max(1000).optional(),
});

export async function assignPatientReferralToDoctorAction(input: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    const actorUserId = session?.user?.id;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const parsed = assignPatientReferralSchema.safeParse(input);

    if (!parsed.success) {
        return { success: false as const, error: "Dados inválidos" };
    }

    const result = await assignPatientReferralToDoctor(
        clinicId,
        parsed.data.patientId,
        parsed.data.doctorId,
        parsed.data.referralSource,
        parsed.data.referralNotes,
        actorUserId
    );

    if (!result.success) {
        return result;
    }

    const patients = await getPatientsByClinic(clinicId);
    const patient = patients.find((item) => item.id === parsed.data.patientId);

    revalidatePath("/doctors");
    revalidatePath("/patients");

    return {
        success: true as const,
        patient: patient
            ? {
                patientId: patient.id,
                patientName: patient.name,
                createdAt: new Date(),
                source: parsed.data.referralSource,
            }
            : null,
    };
}

const removePatientReferralSchema = z.object({
    doctorId: z.string().uuid("Médico inválido"),
    patientId: z.string().uuid("Paciente inválido"),
});

export async function removePatientReferralFromDoctorAction(input: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    const actorUserId = session?.user?.id;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const parsed = removePatientReferralSchema.safeParse(input);

    if (!parsed.success) {
        return { success: false as const, error: "Dados inválidos" };
    }

    const result = await removePatientReferralFromDoctor(
        clinicId,
        parsed.data.patientId,
        parsed.data.doctorId,
        actorUserId
    );

    if (!result.success) {
        return result;
    }

    revalidatePath("/doctors");
    revalidatePath("/patients");

    return { success: true as const };
}
