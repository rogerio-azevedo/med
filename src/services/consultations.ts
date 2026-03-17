import { db } from "@/db";
import { consultations, consultationSoap, vitalSigns } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Service para gerenciar o ciclo de vida de uma consulta clínica
 */
export async function startConsultation(data: {
    patientId: string;
    doctorId: string;
    clinicId: string;
    appointmentId?: string | null;
    type: "consultation" | "return" | "emergency" | "procedure" | "remote" | "phone";
}) {
    try {
        const [newConsultation] = await db.insert(consultations).values({
            ...data,
            status: "in_progress",
            startTime: new Date(),
        }).returning();

        return { success: true, data: newConsultation };
    } catch (error: any) {
        console.error("Error starting consultation:", error);
        return { success: false, error: error.message };
    }
}

export async function finishConsultation(consultationId: string, clinicId: string) {
    try {
        const [updated] = await db
            .update(consultations)
            .set({ 
                status: "finished",
                endTime: new Date() 
            })
            .where(eq(consultations.id, consultationId))
            .returning();
        
        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Salva ou atualiza os sinais vitais
 */
export async function saveVitalSigns(data: any) {
    try {
        const [vitals] = await db
            .insert(vitalSigns)
            .values(data)
            .onConflictDoUpdate({
                target: vitalSigns.consultationId,
                set: data
            })
            .returning();
        return { success: true, data: vitals };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
