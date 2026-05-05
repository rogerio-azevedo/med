import { z } from "zod";

export const patientPlanStatusSchema = z.enum(["active", "completed", "cancelled"]);

export const updatePatientPlanStatusSchema = z.object({
    id: z.string().uuid(),
    status: patientPlanStatusSchema,
});

export type UpdatePatientPlanStatusInput = z.infer<
    typeof updatePatientPlanStatusSchema
>;
