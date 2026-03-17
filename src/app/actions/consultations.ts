"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { startConsultation, finishConsultation } from "@/services/consultations";
import { consultationSchema, vitalSignsSchema } from "@/lib/validations/medical-records";
import { upsertConsultationSoapQuery, upsertVitalSignsQuery } from "@/db/queries/consultations";

export async function startConsultationAction(data: any) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const patientDoctorId = (session.user as any).doctorId || data.doctorId;
    
    if (!patientDoctorId) {
        return { success: false, error: "Apenas médicos podem iniciar um atendimento." };
    }

    const validated = consultationSchema.parse({
        ...data,
        clinicId: session.user.clinicId,
        doctorId: patientDoctorId,
    });

    const result = await startConsultation(validated);
    
    if (result.success) {
        revalidatePath(`/medical-records/${validated.patientId}`);
    }

    return result;
}

export async function saveSoapAction(consultationId: string, patientId: string, data: any) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    try {
        await upsertConsultationSoapQuery({
            ...data,
            consultationId,
        });
        
        revalidatePath(`/medical-records/${patientId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveVitalSignsAction(consultationId: string, patientId: string, data: any) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    try {
        const normalizedData = {
            consultationId,
            weight: data.weight?.trim() || null,
            height: data.height?.trim() || null,
            bloodPressure: data.bloodPressure?.trim() || null,
            heartRate: data.heartRate ? Number(data.heartRate) : null,
            respiratoryRate: data.respiratoryRate ? Number(data.respiratoryRate) : null,
            temperature: data.temperature?.trim() || null,
            oxygenSaturation: data.oxygenSaturation ? Number(data.oxygenSaturation) : null,
        };

        const validated = vitalSignsSchema.parse(normalizedData);
        await upsertVitalSignsQuery(validated);

        revalidatePath(`/medical-records/${patientId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function finishConsultationAction(consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const result = await finishConsultation(consultationId, session.user.clinicId);
    
    if (result.success) {
        revalidatePath(`/medical-records/${patientId}`);
    }

    return result;
}
