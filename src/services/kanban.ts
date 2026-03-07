import * as kanbanQueries from "@/db/queries/kanban";
import { kanbanColumns, kanbanCards } from "@/db/schema/kanban";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";

export async function ensureDefaultColumns(boardId: string, clinicId: string) {
    const existing = await kanbanQueries.getColumnsByBoard(boardId, clinicId);

    if (existing.length === 0) {
        const defaults = [
            { name: "A Fazer", position: 1, columnType: "TO_DO" as const },
            { name: "Em Andamento", position: 2, columnType: "IN_PROGRESS" as const },
            { name: "Concluído", position: 3, columnType: "DONE" as const },
        ];

        for (const col of defaults) {
            await kanbanQueries.createColumn({
                ...col,
                boardId,
                clinicId,
            });
        }
        return await kanbanQueries.getColumnsByBoard(boardId, clinicId);
    }

    return existing;
}

export async function moveCardAndTriggerFlows(
    cardId: string,
    targetColumnId: string,
    position: number,
    clinicId: string
) {
    // 1. Get current card and target column
    const card = await kanbanQueries.getCardById(cardId, clinicId);
    if (!card) throw new Error("Card not found");

    const columns = await db
        .select()
        .from(kanbanColumns)
        .where(eq(kanbanColumns.id, targetColumnId))
        .limit(1);

    const targetColumn = columns[0];
    if (!targetColumn) throw new Error("Target column not found");

    // 2. Move the card
    const updatedCard = await kanbanQueries.moveCard(cardId, targetColumnId, position, clinicId);

    // 3. Check for flows if the target column is DONE
    if (targetColumn.columnType === "DONE") {
        const flows = await kanbanQueries.getBoardFlows(targetColumn.boardId);

        for (const flow of flows) {
            // Find the first TO_DO column in the target board
            const targetBoardColumns = await kanbanQueries.getColumnsByBoard(flow.targetBoardId, clinicId);
            const firstTodoColumn = targetBoardColumns.find(c => c.columnType === "TO_DO") || targetBoardColumns[0];

            if (firstTodoColumn) {
                const newCardData: any = {
                    clinicId,
                    kanbanColumnId: firstTodoColumn.id,
                    sourceCardId: card.id,
                    title: card.title,
                    position: 1, // At the top
                    priority: card.priority,
                };

                // Copy configured fields
                const fieldsToCopy = flow.copyFields as string[] || ["title", "description"];
                if (fieldsToCopy.includes("description")) newCardData.description = card.description;
                if (fieldsToCopy.includes("responsibleId")) newCardData.responsibleId = card.responsibleId;
                if (fieldsToCopy.includes("categoryId")) newCardData.categoryId = card.categoryId;
                if (fieldsToCopy.includes("priority")) newCardData.priority = card.priority;

                await kanbanQueries.createCard(newCardData);
            }
        }
    }

    return updatedCard;
}

export async function getBoardPageData(boardId: string, clinicId: string, filters?: any) {
    const allBoards = await kanbanQueries.getBoardsByClinic(clinicId);

    let targetBoardId = boardId;
    let board = null;

    if (!targetBoardId && allBoards.length > 0) {
        targetBoardId = allBoards[0].id;
    }

    if (targetBoardId) {
        board = await kanbanQueries.getBoardById(targetBoardId, clinicId);
    }

    // If no board exists at all, create a default one
    if (!board && allBoards.length === 0) {
        board = await kanbanQueries.createBoard({
            name: "Meu Kanban",
            clinicId,
            icon: "📋",
        });
        targetBoardId = board.id;
        allBoards.push(board);
    }

    if (!board) {
        return {
            board: null,
            columns: [],
            cards: [],
            allBoards,
            categories: [],
        };
    }

    const [columns, cardsRaw, categories, clinicUsers] = await Promise.all([
        ensureDefaultColumns(targetBoardId, clinicId),
        kanbanQueries.getCardsByBoard(targetBoardId, clinicId, filters),
        kanbanQueries.getCategoriesByClinic(clinicId),
        kanbanQueries.getClinicUsersByClinic(clinicId),
    ]);

    // Flatten cards
    const cards = cardsRaw.map((row: any) => ({
        ...row.card,
        category: row.category,
        responsible: row.responsibleUser ? {
            ...row.responsible,
            user: row.responsibleUser
        } : null
    }));

    return {
        board,
        columns,
        cards,
        allBoards,
        categories,
        clinicUsers,
    };
}
