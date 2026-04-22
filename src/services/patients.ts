import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    patients,
    clinicPatients,
    clinicDoctors,
    addresses,
    patientDoctors,
    patientOrigins,
    patientReferrals,
} from "@/db/schema";
import { deletePatient as deletePatientQuery } from "@/db/queries/patients";
import type { CreatePatientInput, UpdatePatientInput } from "@/validations/patient";
import { syncPatientHealthInsurances } from "@/services/health-insurances";

type ClinicDoctorSelection = {
    validResponsibleDoctorIds: string[];
    validReferralDoctorId: string | undefined;
};

type ReferralSource = NonNullable<CreatePatientInput["referralSource"]>;

type PersistPatientOptions = {
    actorUserId?: string;
};

async function validateClinicDoctorSelection(
    clinicId: string,
    responsibleDoctorIds: string[] | undefined,
    referralDoctorId: string | undefined
): Promise<ClinicDoctorSelection> {
    const requestedDoctorIds = Array.from(
        new Set(
            [...(responsibleDoctorIds ?? []), ...(referralDoctorId ? [referralDoctorId] : [])].filter(
                Boolean
            )
        )
    );

    if (requestedDoctorIds.length === 0) {
        return {
            validResponsibleDoctorIds: [],
            validReferralDoctorId: undefined,
        };
    }

    const clinicDoctorRows = await db
        .select({
            doctorId: clinicDoctors.doctorId,
            relationshipType: clinicDoctors.relationshipType,
        })
        .from(clinicDoctors)
        .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.isActive, true)));

    const clinicDoctorIds = new Set(clinicDoctorRows.map((row) => row.doctorId));
    const linkedDoctorIds = new Set(
        clinicDoctorRows
            .filter((row) => row.relationshipType === "linked")
            .map((row) => row.doctorId)
    );

    const validResponsibleDoctorIds = Array.from(
        new Set((responsibleDoctorIds ?? []).filter((doctorId) => linkedDoctorIds.has(doctorId)))
    );
    const validReferralDoctorId =
        referralDoctorId && clinicDoctorIds.has(referralDoctorId)
            ? referralDoctorId
            : undefined;

    return {
        validResponsibleDoctorIds,
        validReferralDoctorId,
    };
}

async function syncPatientResponsibleDoctors(
    patientId: string,
    responsibleDoctorIds: string[] | undefined
) {
    if (responsibleDoctorIds === undefined) {
        return;
    }

    await db.delete(patientDoctors).where(eq(patientDoctors.patientId, patientId));

    if (responsibleDoctorIds.length === 0) {
        return;
    }

    await db.insert(patientDoctors).values(
        responsibleDoctorIds.map((doctorId) => ({
            patientId,
            doctorId,
        }))
    );
}

async function syncPatientOrigin(
    patientId: string,
    clinicId: string,
    originType: CreatePatientInput["originType"]
) {
    if (!originType) {
        await db
            .delete(patientOrigins)
            .where(
                and(
                    eq(patientOrigins.patientId, patientId),
                    eq(patientOrigins.clinicId, clinicId)
                )
            );
        return;
    }

    const existingOrigin = await db
        .select({
            id: patientOrigins.id,
        })
        .from(patientOrigins)
        .where(
            and(
                eq(patientOrigins.patientId, patientId),
                eq(patientOrigins.clinicId, clinicId)
            )
        )
        .limit(1);

    if (existingOrigin.length > 0) {
        await db
            .update(patientOrigins)
            .set({ originType })
            .where(eq(patientOrigins.id, existingOrigin[0].id));
        return;
    }

    await db.insert(patientOrigins).values({
        patientId,
        clinicId,
        originType,
    });
}

async function syncPatientReferral(
    patientId: string,
    clinicId: string,
    originType: CreatePatientInput["originType"],
    referralDoctorId: string | undefined,
    referralSource: CreatePatientInput["referralSource"],
    referralNotes: string | undefined,
    actorUserId?: string
) {
    const activeReferrals: {
        id: string;
        doctorId: string;
    }[] = [];
    activeReferrals.push(
        ...(await db
            .select({
                id: patientReferrals.id,
                doctorId: patientReferrals.doctorId,
            })
            .from(patientReferrals)
            .where(
                and(
                    eq(patientReferrals.patientId, patientId),
                    eq(patientReferrals.clinicId, clinicId),
                    eq(patientReferrals.status, "active")
                )
            ))
    );

    if (originType !== "medical_referral" || !referralDoctorId) {
        if (activeReferrals.length > 0) {
            await Promise.all(
                activeReferrals.map((referral) =>
                    db
                        .update(patientReferrals)
                        .set({
                            status: "cancelled",
                            cancelledAt: new Date(),
                            cancelledByUserId: actorUserId ?? null,
                            updatedAt: new Date(),
                        })
                        .where(eq(patientReferrals.id, referral.id))
                )
            );
        }
        return;
    }

    const normalizedSource: ReferralSource = referralSource ?? "patient_reported";
    const trimmedNotes = referralNotes?.trim() || null;
    const matchingActiveReferral = activeReferrals.find(
        (referral) => referral.doctorId === referralDoctorId
    );

    for (const referral of activeReferrals) {
        if (referral.id === matchingActiveReferral?.id) {
            continue;
        }

        await db
            .update(patientReferrals)
            .set({
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledByUserId: actorUserId ?? null,
                updatedAt: new Date(),
            })
            .where(eq(patientReferrals.id, referral.id));
    }

    if (matchingActiveReferral) {
        await db
            .update(patientReferrals)
            .set({
                source: normalizedSource,
                notes: trimmedNotes,
                updatedAt: new Date(),
            })
            .where(eq(patientReferrals.id, matchingActiveReferral.id));
        return;
    }

    await db.insert(patientReferrals).values({
        clinicId,
        patientId,
        doctorId: referralDoctorId,
        source: normalizedSource,
        status: "active",
        notes: trimmedNotes,
        createdByUserId: actorUserId ?? null,
        confirmedAt: new Date(),
    });
}

async function syncPatientAddress(
    patientId: string,
    data: Pick<
        CreatePatientInput,
        "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state"
    >
) {
    const { zipCode, street, number, complement, neighborhood, city, state } = data;

    if (!(zipCode || street || city)) {
        return;
    }

    const existingAddress = await db
        .select({
            id: addresses.id,
        })
        .from(addresses)
        .where(and(eq(addresses.entityId, patientId), eq(addresses.entityType, "patient")))
        .limit(1);

    const payload = {
        zipCode: zipCode?.replace(/\D/g, "") || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
    };

    if (existingAddress.length > 0) {
        await db.update(addresses).set(payload).where(eq(addresses.id, existingAddress[0].id));
        return;
    }

    await db.insert(addresses).values({
        entityType: "patient",
        entityId: patientId,
        ...payload,
        isPrimary: true,
    });
}

export async function createPatient(
    data: CreatePatientInput,
    clinicId: string,
    options: PersistPatientOptions = {}
): Promise<{ success: true; patientId?: string } | { success: false; error: string }> {
    const {
        name,
        cpf,
        email,
        phone,
        birthDate,
        sex,
        responsibleDoctorIds,
        originType,
        referralDoctorId,
        referralSource,
        referralNotes,
        patientHealthInsurances,
    } = data;

    const { validResponsibleDoctorIds, validReferralDoctorId } =
        await validateClinicDoctorSelection(clinicId, responsibleDoctorIds, referralDoctorId);

    if (responsibleDoctorIds?.length && validResponsibleDoctorIds.length !== responsibleDoctorIds.length) {
        return { success: false, error: "Há médicos responsáveis inválidos para esta clínica." };
    }

    if (originType === "medical_referral" && !validReferralDoctorId) {
        return { success: false, error: "O médico indicador precisa estar ativo nesta clínica." };
    }

    let insertedPatientId: string | null = null;

    try {
        const [newPatient] = await db
            .insert(patients)
            .values({
                name,
                email: email || null,
                cpf: cpf?.replace(/\D/g, "") || null,
                birthDate: birthDate || null,
                sex: sex || null,
                phone: phone?.replace(/\D/g, "") || null,
            })
            .returning();

        insertedPatientId = newPatient.id;

        await db.insert(clinicPatients).values({
            patientId: newPatient.id,
            clinicId,
        });

        await syncPatientResponsibleDoctors(newPatient.id, validResponsibleDoctorIds);
        await syncPatientOrigin(newPatient.id, clinicId, originType);
        await syncPatientReferral(
            newPatient.id,
            clinicId,
            originType,
            validReferralDoctorId,
            referralSource,
            referralNotes,
            options.actorUserId
        );
        await syncPatientHealthInsurances(newPatient.id, patientHealthInsurances);
        await syncPatientAddress(newPatient.id, data);

        return { success: true, patientId: newPatient.id };
    } catch (err: unknown) {
        if (insertedPatientId) {
            try {
                await db
                    .delete(addresses)
                    .where(
                        and(
                            eq(addresses.entityType, "patient"),
                            eq(addresses.entityId, insertedPatientId)
                        )
                    );
                await db.delete(patientReferrals).where(eq(patientReferrals.patientId, insertedPatientId));
                await db.delete(patientOrigins).where(eq(patientOrigins.patientId, insertedPatientId));
                await db.delete(patientDoctors).where(eq(patientDoctors.patientId, insertedPatientId));
                await db.delete(clinicPatients).where(eq(clinicPatients.patientId, insertedPatientId));
                await db.delete(patients).where(eq(patients.id, insertedPatientId));
            } catch (_rollbackErr) {
                console.error("Falha ao reverter cadastro após erro:", _rollbackErr);
            }
        }

        const error = err as { code?: string; detail?: string };
        if (error.code === "23505" && error.detail?.includes("cpf")) {
            return { success: false, error: "Este CPF já está cadastrado." };
        }

        return { success: false, error: "Erro ao criar paciente." };
    }
}

export async function updatePatient(
    patientId: string,
    data: UpdatePatientInput,
    clinicId: string,
    options: PersistPatientOptions = {}
): Promise<{ success: true } | { success: false; error: string }> {
    const {
        name,
        cpf,
        email,
        phone,
        birthDate,
        sex,
        responsibleDoctorIds,
        originType,
        referralDoctorId,
        referralSource,
        referralNotes,
        patientHealthInsurances,
    } = data;

    const { validResponsibleDoctorIds, validReferralDoctorId } =
        await validateClinicDoctorSelection(clinicId, responsibleDoctorIds, referralDoctorId);

    if (responsibleDoctorIds?.length && validResponsibleDoctorIds.length !== responsibleDoctorIds.length) {
        return { success: false, error: "Há médicos responsáveis inválidos para esta clínica." };
    }

    if (originType === "medical_referral" && !validReferralDoctorId) {
        return { success: false, error: "O médico indicador precisa estar ativo nesta clínica." };
    }

    try {
        await db
            .update(patients)
            .set({
                name,
                email: email || null,
                cpf: cpf?.replace(/\D/g, "") || null,
                birthDate: birthDate || null,
                sex: sex || null,
                phone: phone?.replace(/\D/g, "") || null,
            })
            .where(eq(patients.id, patientId));

        await syncPatientResponsibleDoctors(patientId, validResponsibleDoctorIds);
        await syncPatientOrigin(patientId, clinicId, originType);
        await syncPatientReferral(
            patientId,
            clinicId,
            originType,
            validReferralDoctorId,
            referralSource,
            referralNotes,
            options.actorUserId
        );
        await syncPatientHealthInsurances(patientId, patientHealthInsurances);
        await syncPatientAddress(patientId, data);

        return { success: true };
    } catch (err: unknown) {
        const error = err as { code?: string; detail?: string };
        if (error.code === "23505" && error.detail?.includes("cpf")) {
            return { success: false, error: "Este CPF já está cadastrado." };
        }

        return { success: false, error: "Erro ao atualizar paciente." };
    }
}

export async function assignPatientReferralToDoctor(
    clinicId: string,
    patientId: string,
    doctorId: string,
    referralSource: ReferralSource,
    referralNotes: string | undefined,
    actorUserId?: string
): Promise<{ success: true } | { success: false; error: string }> {
    const clinicPatient = await db.query.clinicPatients.findFirst({
        where: and(
            eq(clinicPatients.clinicId, clinicId),
            eq(clinicPatients.patientId, patientId),
            eq(clinicPatients.isActive, true)
        ),
    });

    if (!clinicPatient) {
        return { success: false, error: "Paciente não encontrado nesta clínica." };
    }

    const { validReferralDoctorId } = await validateClinicDoctorSelection(
        clinicId,
        undefined,
        doctorId
    );

    if (!validReferralDoctorId) {
        return { success: false, error: "Médico indicador inválido para esta clínica." };
    }

    try {
        await syncPatientOrigin(patientId, clinicId, "medical_referral");
        await syncPatientReferral(
            patientId,
            clinicId,
            "medical_referral",
            validReferralDoctorId,
            referralSource,
            referralNotes,
            actorUserId
        );

        return { success: true };
    } catch (error) {
        console.error("Erro ao vincular paciente ao médico indicador:", error);
        return { success: false, error: "Erro ao vincular paciente ao médico." };
    }
}

export async function removePatientReferralFromDoctor(
    clinicId: string,
    patientId: string,
    doctorId: string,
    actorUserId?: string
): Promise<{ success: true } | { success: false; error: string }> {
    const clinicPatient = await db.query.clinicPatients.findFirst({
        where: and(
            eq(clinicPatients.clinicId, clinicId),
            eq(clinicPatients.patientId, patientId),
            eq(clinicPatients.isActive, true)
        ),
    });

    if (!clinicPatient) {
        return { success: false, error: "Paciente não encontrado nesta clínica." };
    }

    const activeReferral = await db.query.patientReferrals.findFirst({
        where: and(
            eq(patientReferrals.clinicId, clinicId),
            eq(patientReferrals.patientId, patientId),
            eq(patientReferrals.doctorId, doctorId),
            eq(patientReferrals.status, "active")
        ),
    });

    if (!activeReferral) {
        return { success: false, error: "Indicação ativa não encontrada para este médico." };
    }

    try {
        await db
            .update(patientReferrals)
            .set({
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledByUserId: actorUserId ?? null,
                updatedAt: new Date(),
            })
            .where(eq(patientReferrals.id, activeReferral.id));

        await syncPatientOrigin(patientId, clinicId, undefined);

        return { success: true };
    } catch (error) {
        console.error("Erro ao remover indicação do médico:", error);
        return { success: false, error: "Erro ao remover indicação do paciente." };
    }
}

export async function deletePatient(
    patientId: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await deletePatientQuery(patientId, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete patient" };
    }
}
