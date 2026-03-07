import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    integer,
    pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clinics, clinicUsers } from "./clinics";

// Enums
export const kanbanColumnTypeEnum = pgEnum("kanban_column_type", [
    "TO_DO",
    "IN_PROGRESS",
    "DONE",
]);

export const kanbanCardPriorityEnum = pgEnum("kanban_card_priority", [
    "LOW",
    "MEDIUM",
    "HIGH",
]);

export const kanbanCardFrequencyEnum = pgEnum("kanban_card_frequency", [
    "DAILY",
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "BIMONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "ANNUAL",
]);

// 1. Kanban Boards
export const kanbanBoards = pgTable("kanban_boards", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 20 }), // Hex or tailwind color
    icon: varchar("icon", { length: 50 }), // Lucide icon name
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Kanban Board Flows
export const kanbanBoardFlows = pgTable("kanban_board_flows", {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceBoardId: uuid("source_board_id")
        .notNull()
        .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    targetBoardId: uuid("target_board_id")
        .notNull()
        .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    triggerColumnType: kanbanColumnTypeEnum("trigger_column_type").default("DONE").notNull(),
    copyFields: jsonb("copy_fields").$type<string[]>().default(["title", "description"]), // Fields to copy to the new card
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Kanban Card Categories
export const kanbanCardCategories = pgTable("kanban_card_categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Kanban Columns
export const kanbanColumns = pgTable("kanban_columns", {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
        .notNull()
        .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    position: integer("position").notNull(),
    columnType: kanbanColumnTypeEnum("column_type").default("TO_DO").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Kanban Cards
export const kanbanCards = pgTable("kanban_cards", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    kanbanColumnId: uuid("kanban_column_id")
        .notNull()
        .references(() => kanbanColumns.id, { onDelete: "cascade" }),
    sourceCardId: uuid("source_card_id"), // Reference to the original card if created by a flow
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    responsibleId: uuid("responsible_id").references(() => clinicUsers.id, { onDelete: "set null" }), // Refers to clinic_users link
    priority: kanbanCardPriorityEnum("priority").default("MEDIUM").notNull(),
    position: integer("position").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    hour: varchar("hour", { length: 5 }), // HH:mm
    isRecurringTask: boolean("is_recurring_task").default(false).notNull(),
    frequency: kanbanCardFrequencyEnum("frequency"),
    weekDay: integer("week_day"), // 0-6
    recurrenceDates: jsonb("recurrence_dates").$type<string[]>(), // ISO date strings
    fileUrls: jsonb("file_urls").$type<string[]>(),
    categoryId: uuid("category_id").references(() => kanbanCardCategories.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Kanban Card Comments
export const kanbanCardComments = pgTable("kanban_card_comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    kanbanCardId: uuid("kanban_card_id")
        .notNull()
        .references(() => kanbanCards.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
