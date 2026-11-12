// Merchant Portal endpoints (`/api/v1/merchant/notifications`): the inbox of the signed-in user, no permission code.
// BE list takes `page`, `size` (at most 100), `unreadOnly` and `category`; the order is fixed newest first.
const MERCHANT = "/api/v1/merchant/notifications";

export const notificationPaths = {
  list: MERCHANT,
  unreadCount: `${MERCHANT}/unread-count`,
  read: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/read`,
  readAll: `${MERCHANT}/read-all`,
} as const;
