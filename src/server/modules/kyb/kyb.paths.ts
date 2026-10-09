// Every call goes through the Merchant Portal chain: the admin chain rejects merchant-realm tokens.
// Creating wallets and deciding a dossier stay Flexpay's and have no merchant route.
const MERCHANT = "/api/v1/merchant";

export const kybPaths = {
  documents: `${MERCHANT}/documents`,
  otpChallenge: `${MERCHANT}/sensitive-operations/otp-challenge`,
  merchantRead: (id: string) => `${MERCHANT}/merchants/${encodeURIComponent(id)}`,
  merchantUpdate: (id: string) => `${MERCHANT}/merchants/${encodeURIComponent(id)}`,
  merchantSubmit: (id: string) => `${MERCHANT}/merchants/${encodeURIComponent(id)}/submit`,
  merchantStatusHistory: (id: string) => `${MERCHANT}/merchants/${encodeURIComponent(id)}/status-history`,
  walletUpdate: (id: string) => `${MERCHANT}/merchants/wallets/${encodeURIComponent(id)}`,
  walletSubmit: (id: string) => `${MERCHANT}/merchants/wallets/${encodeURIComponent(id)}/submit`,
  walletTaxCodeUsage: (id: string) => `${MERCHANT}/merchants/wallets/${encodeURIComponent(id)}/tax-code-usage`,
} as const;
