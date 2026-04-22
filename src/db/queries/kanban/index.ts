import { db } from "@/db";
import {
    kanbanBoards,
    kanbanColumns,
    kanbanCards,
    kanbanCardComments,
    kanbanCardCategories,
    kanbanBoardFlows,
} from "@/db/schema/kanban";
import { clinicUsers } from "@/db/schema/clinics";
import { users } from "@/db/schema/auth";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { doctors, clinicDoctors } from "@/db/schema";

/** Converts an ISO string (or Date) to a Date object, or null if falsy. */
function toDateOrNull(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

// Boards
export async function getBoardsByClinic(clinicId: string) {
    return db
        .select()
        .from(kanbanBoards)
        .where(and(eq(kanbanBoards.clinicId, clinicId), eq(kanbanBoards.isActive, true)))
        .orderBy(asc(kanbanBoards.name));
}

export async function getBoardById(id: string, clinicId: string) {
    const results = await db
        .select()
        .from(kanbanBoards)
        .where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.clinicId, clinicId)))
        .limit(1);
    return results[0] || null;
}

export async function createBoard(data: any) {
    const results = await db.insert(kanbanBoards).values(data).returning();
    return results[0];
}

export async function updateBoard(id: string, data: any, clinicId: string) {
    const results = await db
        .update(kanbanBoards)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.clinicId, clinicId)))
        .returning();
    return results[0];
}

export async function deleteBoardTransferTasks(boardId: string, targetBoardId: string, clinicId: string) {
    // 1. Get the first column of the target board
    const targetColumns = await db
        .select()
        .from(kanbanColumns)
        .where(and(eq(kanbanColumns.boardId, targetBoardId), eq(kanbanColumns.clinicId, clinicId)))
        .orderBy(asc(kanbanColumns.position))
        .limit(1);

    if (targetColumns.length === 0) {
        throw new Error("O quadro de destino não possui colunas para receber as tarefas.");
    }
    const firstTargetColumn = targetColumns[0];

    // 2. Get all columns of the current board
    const currentColumns = await db
        .select({ id: kanbanColumns.id })
        .from(kanbanColumns)
        .where(and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.clinicId, clinicId)));

    const currentColumnIds = currentColumns.map((c) => c.id);

    // 3. Move all cards from current columns to the first target column
    if (currentColumnIds.length > 0) {
        await db
            .update(kanbanCards)
            .set({ 
                kanbanColumnId: firstTargetColumn.id,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(kanbanCards.clinicId, clinicId),
                    inArray(kanbanCards.kanbanColumnId, currentColumnIds)
                )
            );
    }

    // 4. Delete the board (cascades should delete the old columns)
    const results = await db
        .delete(kanbanBoards)
        .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.clinicId, clinicId)))
        .returning();

    return results[0];
}

// Flows
export async function getBoardFlows(sourceBoardId: string) {
    return db
        .select()
        .from(kanbanBoardFlows)
        .where(and(eq(kanbanBoardFlows.sourceBoardId, sourceBoardId), eq(kanbanBoardFlows.isActive, true)));
}

export async function createBoardFlow(data: any) {
    const results = await db.insert(kanbanBoardFlows).values(data).returning();
    return results[0];
}

// Columns
export async function getColumnsByBoard(boardId: string, clinicId: string) {
    return db
        .select()
        .from(kanbanColumns)
        .where(and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.clinicId, clinicId)))
        .orderBy(asc(kanbanColumns.position));
}

export async function createColumn(data: any) {
    const results = await db.insert(kanbanColumns).values(data).returning();
    return results[0];
}

export async function updateColumn(id: string, data: any, clinicId: string) {
    const results = await db
        .update(kanbanColumns)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.clinicId, clinicId)))
        .returning();
    return results[0];
}

export async function deleteColumn(id: string, clinicId: string) {
    const results = await db
        .delete(kanbanColumns)
        .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.clinicId, clinicId)))
        .returning();
    return results[0];
}

// Cards
export async function getCardsByBoard(boardId: string, clinicId: string, filters?: any) {
    // This is a simplified version. Real implementation would involve more complex filtering if needed.
    const columns = db
        .select({ id: kanbanColumns.id })
        .from(kanbanColumns)
        .where(eq(kanbanColumns.boardId, boardId));

    const query = db
        .select({
            card: kanbanCards,
            column: kanbanColumns,
            category: kanbanCardCategories,
            responsible: clinicUsers,
            responsibleUser: users,
        })
        .from(kanbanCards)
        .innerJoin(kanbanColumns, eq(kanbanCards.kanbanColumnId, kanbanColumns.id))
        .leftJoin(kanbanCardCategories, eq(kanbanCards.categoryId, kanbanCardCategories.id))
        .leftJoin(clinicUsers, eq(kanbanCards.responsibleId, clinicUsers.id))
        .leftJoin(users, eq(clinicUsers.userId, users.id))
        .where(and(
            eq(kanbanCards.clinicId, clinicId),
            inArray(kanbanCards.kanbanColumnId, columns)
        ))
        .orderBy(asc(kanbanCards.position));

    // Apply more filters here if provided (responsible, category, dates)

    return query;
}

export async function getCardById(id: string, clinicId: string) {
    const results = await db
        .select()
        .from(kanbanCards)
        .where(and(eq(kanbanCards.id, id), eq(kanbanCards.clinicId, clinicId)))
        .limit(1);
    return results[0] || null;
}

export async function createCard(data: any) {
    const results = await db.insert(kanbanCards).values({
        ...data,
        startDate: toDateOrNull(data.startDate),
        endDate: toDateOrNull(data.endDate),
    }).returning();
    return results[0];
}

export async function updateCard(id: string, data: any, clinicId: string) {
    const results = await db
        .update(kanbanCards)
        .set({
            ...data,
            startDate: toDateOrNull(data.startDate),
            endDate: toDateOrNull(data.endDate),
            updatedAt: new Date(),
        })
        .where(and(eq(kanbanCards.id, id), eq(kanbanCards.clinicId, clinicId)))
        .returning();
    return results[0];
}

export async function moveCard(id: string, columnId: string, position: number, clinicId: string) {
    const results = await db
        .update(kanbanCards)
        .set({
            kanbanColumnId: columnId,
            position,
            updatedAt: new Date()
        })
        .where(and(eq(kanbanCards.id, id), eq(kanbanCards.clinicId, clinicId)))
        .returning();
    return results[0];
}

export async function deleteCard(id: string, clinicId: string) {
    const results = await db
        .delete(kanbanCards)
        .where(and(eq(kanbanCards.id, id), eq(kanbanCards.clinicId, clinicId)))
        .returning();
    return results[0];
}

// Comments
export async function getCommentsByCard(cardId: string) {
    return db
        .select({
            comment: kanbanCardComments,
            user: users,
        })
        .from(kanbanCardComments)
        .innerJoin(users, eq(kanbanCardComments.userId, users.id))
        .where(eq(kanbanCardComments.kanbanCardId, cardId))
        .orderBy(asc(kanbanCardComments.createdAt));
}

export async function createComment(data: any) {
    const results = await db.insert(kanbanCardComments).values(data).returning();
    return results[0];
}

// Categories
export async function getCategoriesByClinic(clinicId: string) {
    return db
        .select()
        .from(kanbanCardCategories)
        .where(eq(kanbanCardCategories.clinicId, clinicId))
        .orderBy(asc(kanbanCardCategories.name));
}

export async function createCategory(data: any) {
    const results = await db.insert(kanbanCardCategories).values(data).returning();
    return results[0];
}

export async function deleteCategory(id: string, clinicId: string) {
    await db
        .delete(kanbanCardCategories)
        .where(and(eq(kanbanCardCategories.id, id), eq(kanbanCardCategories.clinicId, clinicId)));
    return { success: true };
}

export async function getClinicUsersByClinic(clinicId: string) {
    return db
        .select({
            id: clinicUsers.id,
            userId: clinicUsers.userId,
            role: clinicUsers.role,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
            }
        })
        .from(clinicUsers)
        .innerJoin(users, eq(clinicUsers.userId, users.id))
        .innerJoin(doctors, eq(users.id, doctors.userId))
        .innerJoin(clinicDoctors, and(
            eq(clinicDoctors.doctorId, doctors.id),
            eq(clinicDoctors.clinicId, clinicId),
            eq(clinicDoctors.isActive, true)
        ))
        .where(
            and(
                eq(clinicUsers.clinicId, clinicId),
                eq(clinicUsers.isActive, true)
            )
        )
        .orderBy(asc(users.name));
}

export async function reorderColumns(boardId: string, orderedIds: string[], clinicId: string) {
    // Update position for each column in order
    for (let i = 0; i < orderedIds.length; i++) {
        await db
            .update(kanbanColumns)
            .set({ position: i + 1, updatedAt: new Date() })
            .where(
                and(
                    eq(kanbanColumns.id, orderedIds[i]),
                    eq(kanbanColumns.boardId, boardId),
                    eq(kanbanColumns.clinicId, clinicId)
                )
            );
    }
}
