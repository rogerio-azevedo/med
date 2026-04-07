"use server";

import { revalidatePath } from "next/cache";
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
        const procedures = await getProcedures();
        return { success: true, data: procedures };
    } catch (error) {
        console.error("Error loading procedures:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao carregar procedimentos") };
    }
}

export async function createProcedureAction(data: ProcedurePayload) {
    try {
        const newProcedure = await createProcedure(data);
        revalidatePath("/procedures");
        return { success: true, data: newProcedure };
    } catch (error) {
        console.error("Error creating procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao criar procedimento") };
    }
}

export async function updateProcedureAction(id: string, data: ProcedurePayload) {
    try {
        const updatedProcedure = await updateProcedure(id, data);
        revalidatePath("/procedures");
        return { success: true, data: updatedProcedure };
    } catch (error) {
        console.error("Error updating procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao atualizar procedimento") };
    }
}

export async function deleteProcedureAction(id: string) {
    try {
        await deleteProcedure(id);
        revalidatePath("/procedures");
        return { success: true };
    } catch (error) {
        console.error("Error deleting procedure:", error);
        return { success: false, error: getErrorMessage(error, "Erro ao remover procedimento") };
    }
}
