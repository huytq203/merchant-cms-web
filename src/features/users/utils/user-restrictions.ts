import type { MerchantUser } from "../schemas/user.schema";
import { userStatusOf } from "./user-view";

type UserIdentity = Pick<MerchantUser, "id" | "active" | "locked">;

/** Why the actor cannot reset this user's password, or undefined when allowed. */
export function getResetPasswordBlock(user: UserIdentity, actorId: string): string | undefined {
  if (user.id === actorId) return "Bạn không thể đặt lại mật khẩu của chính mình.";
  const status = userStatusOf(user);
  if (status === "LOCKED") return "Tài khoản đang bị khóa. Mở khóa trước khi đặt lại mật khẩu.";
  if (status === "PENDING") return "Chỉ đặt lại được cho tài khoản đang hoạt động.";
  return undefined;
}

/** Why the activation mail cannot be resent, or undefined when the user is still waiting to activate. */
export function getResendActivationBlock(user: UserIdentity): string | undefined {
  return userStatusOf(user) === "PENDING" ? undefined : "Chỉ gửi lại được cho tài khoản đang chờ kích hoạt.";
}

/** Why the lock/unlock action is unavailable, or undefined when the actor can lock or unlock. */
export function getLockBlock(user: UserIdentity, actorId: string): string | undefined {
  const status = userStatusOf(user);
  if (status === "LOCKED") return undefined;
  if (user.id === actorId) return "Bạn không thể khóa chính mình.";
  if (status === "PENDING") return "Chỉ khóa được tài khoản đang hoạt động.";
  return undefined;
}

/** First letters of the last two words, the way Vietnamese names are shortened. */
export function getInitials(name: string): string {
  const letters = name.trim().split(/\s+/).filter(Boolean).slice(-2).map((word) => word.charAt(0).toUpperCase());
  return letters.length > 0 ? letters.join("") : "?";
}
