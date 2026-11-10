const MB = 1024 * 1024;

/** Mirrors `DocumentType` in flex.merchant (domain/file/DocumentType.java); the BE re-checks every upload. */
export const DOCUMENT_RULES = {
  BUSINESS_LICENSE: {
    label: "Giấy phép ĐKKD",
    maxBytes: 5 * MB,
    contentTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  ID_CARD_FRONT: {
    label: "CCCD mặt trước",
    maxBytes: 5 * MB,
    contentTypes: ["image/jpeg", "image/png"],
  },
  ID_CARD_BACK: {
    label: "CCCD mặt sau",
    maxBytes: 5 * MB,
    contentTypes: ["image/jpeg", "image/png"],
  },
  AUTHORIZATION_LETTER: {
    label: "Giấy ủy quyền",
    maxBytes: 10 * MB,
    contentTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  MERCHANT_CONTRACT: {
    label: "Hợp đồng ĐVCNTT",
    maxBytes: 10 * MB,
    contentTypes: ["application/pdf"],
  },
  MERCHANT_LOGO: {
    label: "Logo",
    maxBytes: 2 * MB,
    contentTypes: ["image/jpeg", "image/png"],
  },
  MERCHANT_PRODUCT_IMAGE: {
    label: "Ảnh sản phẩm",
    maxBytes: 5 * MB,
    contentTypes: ["image/jpeg", "image/png"],
  },
} as const;

export type DocumentType = keyof typeof DOCUMENT_RULES;

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_RULES) as DocumentType[];
