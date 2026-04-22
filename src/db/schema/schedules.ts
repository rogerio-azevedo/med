import { pgTable, uuid, text, boolean, timestamp, time, integer, pgEnum } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { doctors } from "./doctors";

export const scheduleBlockReasonEnum = pgEnum("schedule_block_reason", [
    "vacation",
    "sick_leave",
    "conference",
    "personal",
    "holiday",
    "other",
]);

export const doctorSchedules = pgTable("doctor_schedules", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0=Dom ... 6=Sab
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    slotDurationMin: integer("slot_duration_min").default(30),
    isActive: boolean("is_active").default(true).notNull(),
});

export const doctorScheduleBlocks = pgTable("doctor_schedule_blocks", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    reason: scheduleBlockReasonEnum("reason").notNull(),
    note: text("note"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
