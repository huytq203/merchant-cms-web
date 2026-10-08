import type { MerchantUser, MerchantUserStatus } from "../schemas/user.schema";

type UserFlags = Pick<MerchantUser, "active" | "locked">;

/**
 * The BE sends two booleans and no status, so this is the one place they are read as a status for
 * display and action gating. It is never stored on the user and never sent back.
 */
export function userStatusOf(user: UserFlags): MerchantUserStatus {
  if (user.locked) return "LOCKED";
  return user.active ? "ACTIVE" : "PENDING";
}

/** The name the BE stored, or undefined: the email is shown on its own line, never copied into the name. */
export function nameOf(user: Pick<MerchantUser, "fullName">): string | undefined {
  return user.fullName?.trim() || undefined;
}

/** Text for labels that need one string per user, such as button names read by screen readers. */
export function labelOf(user: Pick<MerchantUser, "fullName" | "email">): string {
  return nameOf(user) ?? user.email;
}
