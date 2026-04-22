"use server";

import {
    getPracticeAreas,
    createPracticeArea,
    updatePracticeArea,
    deletePracticeArea,
} from "@/db/queries/practice-areas";
import { revalidatePath } from "next/cache";

export async function getPracticeAreasAction() {
    try {
        const practiceAreas = await getPracticeAreas();
        return { success: true, data: practiceAreas };
    } catch (error) {
        return { success: false, error: "Erro ao carregar áreas de atuação" };
    }
}

export async function createPracticeAreaAction(data: {
    name: string;
    code?: string;
}) {
    try {
        const newPracticeArea = await createPracticeArea(data);
        revalidatePath("/practice-areas");
        return { success: true, data: newPracticeArea };
    } catch (error) {
        return { success: false, error: "Erro ao criar área de atuação" };
    }
}

export async function updatePracticeAreaAction(
    id: string,
    data: { name: string; code?: string }
) {
    try {
        const updatedPracticeArea = await updatePracticeArea(id, data);
        revalidatePath("/practice-areas");
        return { success: true, data: updatedPracticeArea };
    } catch (error) {
        return { success: false, error: "Erro ao atualizar área de atuação" };
    }
}

export async function deletePracticeAreaAction(id: string) {
    try {
        await deletePracticeArea(id);
        revalidatePath("/practice-areas");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao deletar área de atuação" };
    }
}
