/**
 * The one-time ticket that verify-otp returns while a user is still on a temporary password.
 * It lives in sessionStorage only: it dies with the tab and is never readable by other tabs or
 * left behind in localStorage. Every access is guarded because storage can be blocked.
 */
const STORAGE_KEY = "flexpay.change-password-ticket";

/** Code the BE gives a wrong, used or expired ticket; the page answers it by going back to the login page. */
export const CHANGE_PASSWORD_TICKET_INVALID = "CHANGE_PASSWORD_TICKET_INVALID";

/** Where the login page learns why the user was sent back, and what it tells them. */
export const CHANGE_PASSWORD_EXPIRED_REASON = "change-password-expired";
export const CHANGE_PASSWORD_EXPIRED_MESSAGE = "Phiên đổi mật khẩu đã hết hạn, vui lòng đăng nhập lại.";

/**
 * The BE changed the password but could not issue tokens. It answers with this sentence; the page
 * drops the ticket (it is spent) and the login page repeats the sentence.
 */
export const PASSWORD_CHANGED_REASON = "password-changed";
export const PASSWORD_CHANGED_MESSAGE = "Đổi mật khẩu thành công, vui lòng đăng nhập lại bằng mật khẩu mới.";
export const PASSWORD_CHANGED_URL = `/login?reason=${PASSWORD_CHANGED_REASON}`;
export const CHANGE_PASSWORD_EXPIRED_URL = `/login?reason=${CHANGE_PASSWORD_EXPIRED_REASON}`;

export interface StoredChangePasswordTicket {
  ticket: string;
  /** Epoch milliseconds after which the BE no longer accepts the ticket. */
  expiresAt: number;
}

export function saveChangePasswordTicket(ticket: string, expiresInSeconds: number, now: number = Date.now()): void {
  try {
    const value: StoredChangePasswordTicket = { ticket, expiresAt: now + expiresInSeconds * 1000 };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the change-password page will find no ticket and send the user back to log in.
  }
}

export function clearChangePasswordTicket(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/** The stored ticket, or null when there is none, it is unreadable, or it has expired (expired ones are dropped). */
export function readChangePasswordTicket(now: number = Date.now()): StoredChangePasswordTicket | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredChangePasswordTicket> | null;
    if (typeof value?.ticket === "string" && value.ticket && typeof value.expiresAt === "number" && value.expiresAt > now) {
      return { ticket: value.ticket, expiresAt: value.expiresAt };
    }
  } catch {
    // Fall through: unreadable storage counts as no ticket.
  }
  clearChangePasswordTicket();
  return null;
}
