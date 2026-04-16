"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
    createProcedure,
    deleteProcedure,
    getProcedures,
    updateProcedure,
    type ProcedurePayload,
} from "@/db/queries/procedures";

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

export async function getProceduresAction() {
    try {
        const session = await auth();
        if (!session?.user?.clinicId) {
            return { success: false, error: "Não autorizado" };
        }

        const proceduresList = await getProcedures(session.user.clinicId);
        return { success: true, data: proceduresList };
    } catch (error) {
        console.error("Error loading procedures:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao carregar procedimentos") };
    }
}

export async function createProcedureAction(data: ProcedurePayload) {
    try {
        const session = await auth();
        if (!session?.user?.clinicId) {
            return { success: false, error: "Não autorizado" };
        }

        const newProcedure = await createProcedure(session.user.clinicId, data);
        revalidatePath("/procedures");
        return { success: true, data: newProcedure };
    } catch (error) {
        console.error("Error creating procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao criar procedimento") };
    }
}

export async function updateProcedureAction(id: string, data: ProcedurePayload) {
    try {
        const session = await auth();
        if (!session?.user?.clinicId) {
            return { success: false, error: "Não autorizado" };
        }

        const updatedProcedure = await updateProcedure(id, session.user.clinicId, data);
        revalidatePath("/procedures");
        return { success: true, data: updatedProcedure };
    } catch (error) {
        console.error("Error updating procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao atualizar procedimento") };
    }
}

export async function deleteProcedureAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.clinicId) {
            return { success: false, error: "Não autorizado" };
        }

        await deleteProcedure(id, session.user.clinicId);
        revalidatePath("/procedures");
        return { success: true };
    } catch (error) {
        console.error("Error deleting procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao remover procedimento") };
    }
}
