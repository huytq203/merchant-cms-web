import { DOCUMENT_RULES, DOCUMENT_TYPES, type DocumentType } from "../constants/document-rules";

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && DOCUMENT_TYPES.some((type) => type === value);
}

const EXTENSION_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

export function acceptedFormatsLabel(type: DocumentType) {
  return DOCUMENT_RULES[type].contentTypes
    .map((contentType) => EXTENSION_LABEL[contentType] ?? contentType)
    .join("/");
}

export function maxSizeLabel(type: DocumentType) {
  return `${DOCUMENT_RULES[type].maxBytes / (1024 * 1024)}MB`;
}

/** Returns a Vietnamese error message, or null when the file may be uploaded. */
export function validateDocumentFile(
  file: Pick<File, "size" | "type">,
  type: DocumentType,
): string | null {
  const rule = DOCUMENT_RULES[type];
  if (file.size === 0) return "Tệp rỗng";
  if (!rule.contentTypes.some((contentType) => contentType === file.type.toLowerCase())) {
    return `${rule.label} chỉ nhận ${acceptedFormatsLabel(type)}`;
  }
  if (file.size > rule.maxBytes) {
    return `${rule.label} tối đa ${maxSizeLabel(type)}`;
  }
  return null;
}
