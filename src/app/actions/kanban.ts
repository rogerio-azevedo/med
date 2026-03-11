"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as kanbanService from "@/services/kanban";
import * as kanbanQueries from "@/db/queries/kanban";
import {
    createBoardSchema,
    createCardSchema,
    updateCardSchema,
    moveCardSchema,
    createCommentSchema,
    createCategorySchema,
    createBoardFlowSchema,
    createColumnSchema,
    updateColumnSchema,
    updateBoardSchema,
    deleteBoardSchema,
} from "@/lib/validations/kanban";

async function getSession() {
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session as { user: { id: string; clinicId: string } };
}

// Boards
export async function createBoardAction(data: any) {
    const session = await getSession();
    const parsed = createBoardSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const board = await kanbanQueries.createBoard({
            ...parsed.data,
            clinicId: session.user.clinicId,
        });
        revalidatePath("/tarefas");
        return { success: true, data: board };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateBoardAction(id: string, data: any) {
    const session = await getSession();
    const parsed = updateBoardSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const board = await kanbanQueries.updateBoard(id, parsed.data, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true, data: board };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteBoardAction(boardId: string, targetBoardId: string) {
    const session = await getSession();
    const parsed = deleteBoardSchema.safeParse({ boardId, targetBoardId });
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        await kanbanQueries.deleteBoardTransferTasks(boardId, targetBoardId, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// Flows
export async function createBoardFlowAction(data: any) {
    const session = await getSession();
    const parsed = createBoardFlowSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const flow = await kanbanQueries.createBoardFlow(parsed.data);
        revalidatePath("/tarefas");
        return { success: true, data: flow };
    } catch (e: any) {
        return { error: e.message };
    }
}

// Cards
export async function createCardAction(data: any) {
    const session = await getSession();
    const parsed = createCardSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const card = await kanbanQueries.createCard({
            ...parsed.data,
            clinicId: session.user.clinicId,
        });
        revalidatePath("/tarefas");
        return { success: true, data: card };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateCardAction(id: string, data: any) {
    const session = await getSession();
    const parsed = updateCardSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const card = await kanbanQueries.updateCard(id, parsed.data, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true, data: card };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteCardAction(id: string) {
    const session = await getSession();
    try {
        await kanbanQueries.deleteCard(id, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function moveCardAction(data: { cardId: string; targetColumnId: string; position: number }) {
    const session = await getSession();
    const parsed = moveCardSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const card = await kanbanService.moveCardAndTriggerFlows(
            parsed.data.cardId,
            parsed.data.targetColumnId,
            parsed.data.position,
            session.user.clinicId
        );
        revalidatePath("/tarefas");
        return { success: true, data: card };
    } catch (e: any) {
        return { error: e.message };
    }
}

// Comments
export async function createCommentAction(data: any) {
    const session = await getSession();
    const parsed = createCommentSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const comment = await kanbanQueries.createComment({
            ...parsed.data,
            userId: session.user.id,
        });
        revalidatePath("/tarefas");
        return { success: true, data: comment };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getCardCommentsAction(cardId: string) {
    await getSession();
    try {
        const rows = await kanbanQueries.getCommentsByCard(cardId);
        // Flatten shape: { id, content, createdAt, user: { name, ... } }
        const comments = rows.map((r: any) => ({
            ...r.comment,
            user: r.user,
        }));
        return { success: true, data: comments };
    } catch (e: any) {
        return { error: e.message };
    }
}


// Categories
export async function createCategoryAction(data: any) {
    const session = await getSession();
    const parsed = createCategorySchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const category = await kanbanQueries.createCategory({
            ...parsed.data,
            clinicId: session.user.clinicId,
        });
        revalidatePath("/tarefas");
        return { success: true, data: category };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteCategoryAction(id: string) {
    const session = await getSession();
    try {
        await kanbanQueries.deleteCategory(id, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// Columns
export async function createColumnAction(data: any) {
    const session = await getSession();
    const parsed = createColumnSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const column = await kanbanQueries.createColumn({
            ...parsed.data,
            clinicId: session.user.clinicId,
            columnType: "IN_PROGRESS",
        });
        revalidatePath("/tarefas");
        return { success: true, data: column };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateColumnAction(id: string, data: any) {
    const session = await getSession();
    const parsed = updateColumnSchema.safeParse(data);
    if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

    try {
        const column = await kanbanQueries.updateColumn(id, parsed.data, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true, data: column };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteColumnAction(id: string) {
    const session = await getSession();
    try {
        await kanbanQueries.deleteColumn(id, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function reorderColumnsAction(boardId: string, columnIds: string[]) {
    const session = await getSession();
    try {
        await kanbanQueries.reorderColumns(boardId, columnIds, session.user.clinicId);
        revalidatePath("/tarefas");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
