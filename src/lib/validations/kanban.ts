import { z } from "zod";

export const kanbanColumnTypeEnum = z.enum(["TO_DO", "IN_PROGRESS", "DONE"]);
export const kanbanCardPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const kanbanCardFrequencyEnum = z.enum([
    "DAILY",
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "BIMONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "ANNUAL",
]);

export const createBoardSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    description: z.string().optional(),
    color: z.string().max(20).optional(),
    icon: z.string().max(50).optional(),
});

export const updateBoardSchema = createBoardSchema.partial();

export const deleteBoardSchema = z.object({
    boardId: z.string().uuid(),
    targetBoardId: z.string().uuid(),
});

export const createBoardFlowSchema = z.object({
    sourceBoardId: z.string().uuid(),
    targetBoardId: z.string().uuid(),
    triggerColumnType: kanbanColumnTypeEnum.default("DONE"),
    copyFields: z.array(z.string()).default(["title", "description"]),
    isActive: z.boolean().default(true),
});

export const createColumnSchema = z.object({
    boardId: z.string().uuid(),
    name: z.string().min(1, "Nome é obrigatório").max(100),
    position: z.number().int().min(0),
    columnType: kanbanColumnTypeEnum.default("TO_DO"),
});

export const updateColumnSchema = createColumnSchema.omit({ boardId: true }).partial();

export const createCardSchema = z.object({
    kanbanColumnId: z.string().uuid(),
    title: z.string().min(1, "Título é obrigatório").max(255),
    description: z.string().optional(),
    responsibleId: z.string().uuid().nullable().optional(),
    priority: kanbanCardPriorityEnum.default("MEDIUM"),
    position: z.number().int().min(0),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    hour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)").nullable().optional(),
    isRecurringTask: z.boolean().default(false),
    frequency: kanbanCardFrequencyEnum.nullable().optional(),
    weekDay: z.number().int().min(0).max(6).nullable().optional(),
    recurrenceDates: z.array(z.string().datetime()).optional(),
    fileUrls: z.array(z.string().url()).optional(),
    categoryId: z.string().uuid().nullable().optional(),
});

export const updateCardSchema = createCardSchema.partial();

export const moveCardSchema = z.object({
    cardId: z.string().uuid(),
    targetColumnId: z.string().uuid(),
    position: z.number().int().min(0),
});

export const createCommentSchema = z.object({
    kanbanCardId: z.string().uuid(),
    content: z.string().min(1, "Conteúdo é obrigatório"),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
    color: z.string().max(20).optional(),
});
