import { z } from "zod";

/**
 * What a reset did, as the BE reports it:
 * - TEMP_PASSWORD: a temporary password (valid 24 hours) was mailed; the user must change it at first login.
 * - RESET_LINK: the older flow, a link to set a new password was mailed.
 * - ACTIVATION_RESENT: the user never activated, so the activation mail was sent again.
 */
export const passwordResetModeSchema = z.enum(["TEMP_PASSWORD", "RESET_LINK", "ACTIVATION_RESENT"]);

export const passwordResetResultSchema = z.object({
  mode: passwordResetModeSchema.catch("RESET_LINK"),
  // A malformed flag must not read as a success: the yellow toast tells the admin to follow up by hand.
  emailSent: z.boolean().catch(false),
});

/** Only these two fields leave the server: nothing else the BE sends (ids, secrets) reaches the browser. */
export type PasswordResetResult = z.infer<typeof passwordResetResultSchema>;
export type PasswordResetMode = z.infer<typeof passwordResetModeSchema>;

/** An older BE answers a reset with no body; it sent the link and threw if the mail failed, so that means sent. */
export const LEGACY_PASSWORD_RESET_RESULT: PasswordResetResult = { mode: "RESET_LINK", emailSent: true };
