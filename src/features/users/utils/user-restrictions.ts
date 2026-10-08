import type { MerchantUserStatus } from "../schemas/user.schema";

interface UserIdentity {
  id: string;
  status: MerchantUserStatus;
}

/** Why the actor cannot reset this user's password, or undefined when allowed. */
export function getResetPasswordBlock(user: UserIdentity, actorId: string): string | undefined {
  if (user.id === actorId) return "Bạn không thể đặt lại mật khẩu của chính mình.";
  if (user.status === "LOCKED") return "Tài khoản đang bị khóa. Mở khóa trước khi đặt lại mật khẩu.";
  if (user.status === "PENDING") return "Chỉ đặt lại được cho tài khoản đang hoạt động.";
  return undefined;
}

/** Why the lock/unlock action is unavailable, or undefined when the actor can lock or unlock. */
export function getLockBlock(user: UserIdentity, actorId: string): string | undefined {
  if (user.status === "LOCKED") return undefined;
  if (user.id === actorId) return "Bạn không thể khóa chính mình.";
  if (user.status === "PENDING") return "Chỉ khóa được tài khoản đang hoạt động.";
  return undefined;
}

/** First letters of the last two words, the way Vietnamese names are shortened. */
export function getInitials(name: string): string {
  const letters = name.trim().split(/\s+/).filter(Boolean).slice(-2).map((word) => word.charAt(0).toUpperCase());
  return letters.length > 0 ? letters.join("") : "?";
}
