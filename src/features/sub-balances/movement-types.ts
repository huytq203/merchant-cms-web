import type { z } from "zod";
import type {
  movementDetailSchema, movementFilterSchema, movementLineSchema, movementListResultSchema, movementSchema, movementTypeFilterSchema,
} from "./movement-schemas";

export type Movement = z.infer<typeof movementSchema>;
export type MovementLine = z.infer<typeof movementLineSchema>;
export type MovementDetail = z.infer<typeof movementDetailSchema>;
export type MovementLink = NonNullable<MovementDetail["link"]>;
export type MovementListResult = z.infer<typeof movementListResultSchema>;
export type MovementTypeFilter = z.infer<typeof movementTypeFilterSchema>;
export type MovementFilter = z.infer<typeof movementFilterSchema>;
