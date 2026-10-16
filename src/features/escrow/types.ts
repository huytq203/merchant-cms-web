import type { z } from "zod";
import type { escrowContributionSchema, escrowLedgerEntrySchema, escrowLedgerKindSchema, escrowStandingSchema, escrowStateSchema } from "./schemas";

export type EscrowStanding = z.infer<typeof escrowStandingSchema>;
export type EscrowState = z.infer<typeof escrowStateSchema>;
export type EscrowLedgerEntry = z.infer<typeof escrowLedgerEntrySchema>;
export type EscrowLedgerKind = z.infer<typeof escrowLedgerKindSchema>;
export type EscrowContribution = z.infer<typeof escrowContributionSchema>;
