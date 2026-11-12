// Merchant Portal endpoints (`/api/v1/merchant/orders`): scoped by the session, never by a merchantId from the client.
// BE deliberately has no confirm or retry-credit on this chain: manual payment confirmation stays an admin action.
// List filters BE reads: merchantCode, orderCode (khớp cả mã đơn và mã GD FM…), status, subMerchantIds (nối dấu phẩy), createdFrom/createdTo (yyyy-MM-dd) and pagination.
const MERCHANT = "/api/v1/merchant/orders";

export const orderPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  cancel: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/cancel`,
  refreshQr: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/refresh-qr`,
} as const;
