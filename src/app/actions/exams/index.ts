"use server";

import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { consultations, examRequests } from "@/db/schema";
import { getConsultationDetails } from "@/db/queries/consultations";
import {
    createExamSchema,
    examProcedurePayloadSchema,
    updateExamSchema,
} from "@/validations/medical-records";
import {
    deleteExamProcedureQuery,
    deleteExamQuery,
    getExamMinimal,
    insertExamProcedureQuery,
    insertExamQuery,
    setExamRequestFulfilledQuery,
    updateExamQuery,
} from "@/db/queries/exams";

function revalidateExamPaths(patientId: string) {
    revalidatePath(`/medical-records/${patientId}`);
    revalidatePath("/gestao/exames");
    revalidatePath("/dashboard");
}

function parseOptionalDate(value: string | null | undefined): Date | null {
    if (value == null || value === "") return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function sessionDoctorId(session: { doctorId?: string | null }): string | undefined {
    return session.doctorId ?? undefined;
}

/**
 * Quem pode alterar notas/procedimentos do exame:
 * qualquer usuário autenticado na mesma clínica que já foi validada pelo `examId`/patient.
 * Preferências específicas: admin; médico executor (`exam.doctorId`); ou médico da consulta vinculada.
 * Demais perfis da clínica também podem registrar (fluxo típico: recepcionista ou equipe técnica).
 */
async function canMutateExam(
    session: { doctorId?: string | null; clinicRole?: string | null; role?: string | null },
    exam: { doctorId: string | null; consultationId: string | null },
    clinicId: string
): Promise<boolean> {
    const isAdmin = session.clinicRole === "admin" || session.role === "super_admin";
    if (isAdmin) return true;
    const docId = sessionDoctorId(session);
    if (docId) {
        if (exam.doctorId == null || exam.doctorId === docId) return true;
        if (exam.consultationId) {
            const c = await db.query.consultations.findFirst({
                where: and(eq(consultations.id, exam.consultationId), eq(consultations.clinicId, clinicId)),
                columns: { doctorId: true },
            });
            if (c?.doctorId === docId) return true;
        }
    }
    return true;
}

export async function createExamAction(data: Record<string, unknown>) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    try {
        const validated = createExamSchema.parse({
            ...data,
            clinicId,
            healthInsuranceId:
                data.healthInsuranceId === "" || data.healthInsuranceId === undefined
                    ? null
                    : data.healthInsuranceId,
            consultationId:
                data.consultationId === "" || data.consultationId === undefined
                    ? null
                    : data.consultationId,
            examRequestId:
                data.examRequestId === "" || data.examRequestId === undefined
                    ? null
                    : data.examRequestId,
            serviceTypeId:
                data.serviceTypeId === "" || data.serviceTypeId === undefined
                    ? null
                    : data.serviceTypeId,
            doctorId:
                data.doctorId === "" || data.doctorId === undefined ? null : data.doctorId,
        });

        if (validated.consultationId) {
            const c = await getConsultationDetails(validated.consultationId, clinicId);
            if (!c || c.patientId !== validated.patientId) {
                return {
                    success: false as const,
                    error: "Consulta inválida para este paciente.",
                };
            }
        }

        if (validated.examRequestId) {
            const reqRow = await db.query.examRequests.findFirst({
                where: and(
                    eq(examRequests.id, validated.examRequestId),
                    eq(examRequests.clinicId, clinicId),
                    eq(examRequests.patientId, validated.patientId)
                ),
                columns: { id: true },
            });
            if (!reqRow) {
                return { success: false as const, error: "Pedido de exame inválido para este paciente." };
            }
        }

        const doctorId =
            validated.doctorId !== undefined && validated.doctorId !== ""
                ? validated.doctorId
                : sessionDoctorId(session.user) ?? null;

        const row = await insertExamQuery({
            patientId: validated.patientId,
            clinicId: validated.clinicId,
            doctorId,
            consultationId: validated.consultationId ?? null,
            examRequestId: validated.examRequestId ?? null,
            serviceTypeId: validated.serviceTypeId ?? null,
            healthInsuranceId: validated.healthInsuranceId ?? null,
            status: validated.status,
            location: validated.location,
            careType: validated.location === "external" ? (validated.careType ?? null) : null,
            clinicalIndication:
                validated.location === "external" ? (validated.clinicalIndication?.trim() || null) : null,
            notes: validated.notes ?? null,
            scheduledAt: parseOptionalDate(validated.scheduledAt ?? undefined),
            startTime: new Date(),
            endTime: null,
        });

        if (!row) {
            return { success: false as const, error: "Não foi possível criar o registro de exame." };
        }

        revalidateExamPaths(validated.patientId);
        return { success: true as const, exam: row };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

export async function updateExamNotesAction(examId: string, patientId: string, notes: string | null) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }
    if (!(await canMutateExam(session.user, exam, clinicId))) {
        return { success: false as const, error: "Sem permissão para editar este exame." };
    }

    const updated = await updateExamQuery(examId, clinicId, {
        notes: notes ?? null,
    });
    if (!updated) return { success: false as const, error: "Falha ao salvar." };

    revalidateExamPaths(patientId);
    return { success: true as const };
}

export async function updateExamAction(examId: string, patientId: string, data: Record<string, unknown>) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }
    if (!(await canMutateExam(session.user, exam, clinicId))) {
        return { success: false as const, error: "Sem permissão para editar este exame." };
    }

    try {
        const validated = updateExamSchema.parse(data);
        const patch: Parameters<typeof updateExamQuery>[2] = {};

        if (Object.prototype.hasOwnProperty.call(data, "doctorId")) {
            patch.doctorId = validated.doctorId ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "consultationId")) {
            patch.consultationId = validated.consultationId ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "examRequestId")) {
            patch.examRequestId = validated.examRequestId ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "serviceTypeId")) {
            patch.serviceTypeId = validated.serviceTypeId ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "healthInsuranceId")) {
            patch.healthInsuranceId = validated.healthInsuranceId ?? null;
        }
        if (validated.status !== undefined) patch.status = validated.status;
        if (validated.location !== undefined) patch.location = validated.location;
        if (Object.prototype.hasOwnProperty.call(data, "careType")) {
            patch.careType = validated.careType ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "clinicalIndication")) {
            patch.clinicalIndication = validated.clinicalIndication?.trim() || null;
        }
        if (patch.location === "in_clinic") {
            patch.careType = null;
            patch.clinicalIndication = null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "notes")) {
            patch.notes = validated.notes ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(data, "scheduledAt")) {
            patch.scheduledAt = parseOptionalDate(validated.scheduledAt ?? undefined);
        }
        if (Object.prototype.hasOwnProperty.call(data, "startTime")) {
            patch.startTime = validated.startTime ? parseOptionalDate(validated.startTime) ?? undefined : undefined;
        }
        if (Object.prototype.hasOwnProperty.call(data, "endTime")) {
            patch.endTime = validated.endTime ? parseOptionalDate(validated.endTime) ?? undefined : undefined;
        }

        const cid = validated.consultationId;
        if (cid) {
            const c = await getConsultationDetails(cid, clinicId);
            if (!c || c.patientId !== patientId) {
                return { success: false as const, error: "Consulta inválida para este paciente." };
            }
        }

        const updated = await updateExamQuery(examId, clinicId, patch);
        if (!updated) return { success: false as const, error: "Falha ao salvar." };

        revalidateExamPaths(patientId);
        return { success: true as const };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

export async function addExamProcedureAction(
    examId: string,
    patientId: string,
    payload: Record<string, unknown>
) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }
    if (!(await canMutateExam(session.user, exam, clinicId))) {
        return { success: false as const, error: "Sem permissão para editar este exame." };
    }

    try {
        const validated = examProcedurePayloadSchema.parse(payload);
        const row = await insertExamProcedureQuery({
            examId,
            procedureId: validated.procedureId,
            quantity: validated.quantity,
            notes: validated.notes ?? null,
        });
        if (!row) return { success: false as const, error: "Não foi possível adicionar o procedimento." };

        revalidateExamPaths(patientId);
        return { success: true as const, procedureLink: row };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

export async function removeExamProcedureAction(
    examId: string,
    patientId: string,
    examProcedureId: string
) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }
    if (!(await canMutateExam(session.user, exam, clinicId))) {
        return { success: false as const, error: "Sem permissão para editar este exame." };
    }

    const removed = await deleteExamProcedureQuery(examProcedureId, examId);
    if (!removed) return { success: false as const, error: "Procedimento não encontrado." };

    revalidateExamPaths(patientId);
    return { success: true as const };
}

export async function finishExamAction(examId: string, patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }
    if (!(await canMutateExam(session.user, exam, clinicId))) {
        return { success: false as const, error: "Sem permissão para finalizar este exame." };
    }

    const updated = await updateExamQuery(examId, clinicId, {
        status: "finished",
        endTime: new Date(),
    });
    if (!updated) return { success: false as const, error: "Falha ao finalizar." };

    if (exam.examRequestId) {
        await setExamRequestFulfilledQuery(exam.examRequestId, clinicId, examId);
    }

    revalidateExamPaths(patientId);
    return { success: true as const };
}

export async function deleteExamAction(examId: string, patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) return { success: false as const, error: "Não autorizado" };

    const exam = await getExamMinimal(examId, clinicId);
    if (!exam || exam.patientId !== patientId) {
        return { success: false as const, error: "Exame não encontrado." };
    }

    const isAdmin = session.user.clinicRole === "admin" || session.user.role === "super_admin";
    const hasDeletePermission = await can("medical-records", "can_delete");
    const docId = sessionDoctorId(session.user);
    const isAssignedDoctor = !!docId && exam.doctorId != null && exam.doctorId === docId;

    if (!isAdmin && !hasDeletePermission && !isAssignedDoctor) {
        return {
            success: false as const,
            error: "Sem permissão para excluir este registro de exame.",
        };
    }

    if (exam.examRequestId) {
        await setExamRequestFulfilledQuery(exam.examRequestId, clinicId, null);
    }

    const result = await deleteExamQuery(examId, clinicId);
    if (!result?.length) {
        return { success: false as const, error: "Exame não encontrado ou já excluído." };
    }

    revalidateExamPaths(patientId);
    return { success: true as const };
}
