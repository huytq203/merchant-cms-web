const ADMIN = "/api/v1/admin";

export const kybPaths = {
  availability: `${ADMIN}/enterprise-wallets/availability`,
  walletDrafts: `${ADMIN}/enterprise-wallets/drafts`,
  wallets: `${ADMIN}/enterprise-wallets`,
  wallet: (id: string) => `${ADMIN}/enterprise-wallets/${encodeURIComponent(id)}`,
  walletSubmit: (id: string) => `${ADMIN}/enterprise-wallets/${encodeURIComponent(id)}/submit`,
  walletDocuments: (id: string) => `${ADMIN}/enterprise-wallets/${encodeURIComponent(id)}/documents`,
  documents: `${ADMIN}/documents`,
  merchants: `${ADMIN}/merchants`,
  merchant: (id: string) => `${ADMIN}/merchants/${encodeURIComponent(id)}`,
  merchantSubmit: (id: string) => `${ADMIN}/merchants/${encodeURIComponent(id)}/submit`,
  merchantStatusHistory: (id: string) => `${ADMIN}/merchants/${encodeURIComponent(id)}/status-history`,
  merchantRejectionReasons: `${ADMIN}/merchants/rejection-reasons`,
} as const;
