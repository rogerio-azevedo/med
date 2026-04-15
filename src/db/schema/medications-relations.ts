import { relations } from "drizzle-orm";
import { medications } from "./medications";
import { prescriptions } from "./clinical-chart";

/** Reverse relation: catalog medication → lines referenced on prescriptions. */
export const medicationsRelations = relations(medications, ({ many }) => ({
    prescriptionLines: many(prescriptions),
}));
