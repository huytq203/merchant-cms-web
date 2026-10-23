// Merchant Portal inbox (realm ewallet-merchant). The BE takes the recipient from the token only,
// so no path or query here ever carries a user id.
const MERCHANT = "/api/v1/merchant/notifications";

export const notificationPaths = {
  list: MERCHANT,
  unreadCount: `${MERCHANT}/unread-count`,
  read: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/read`,
  readAll: `${MERCHANT}/read-all`,
} as const;
