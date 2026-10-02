export type BeError = {
  /** HTTP status; 0 for network and timeout failures. */
  status: number;
  /** Backend error code name, or NETWORK | TIMEOUT | INVALID_RESPONSE | HTTP_<status>. */
  code: string;
  /** Safe to show to the user. */
  message: string;
  fieldErrors?: Record<string, string>;
};

const SERVER_MESSAGE = "Hệ thống đang gặp sự cố, vui lòng thử lại sau";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ",
  401: "Phiên đăng nhập đã hết hạn",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu",
  409: "Dữ liệu đã thay đổi, vui lòng tải lại",
  429: "Thao tác quá nhanh, vui lòng thử lại sau",
};

export const NETWORK_ERROR: BeError = {
  status: 0,
  code: "NETWORK",
  message: "Không kết nối được tới hệ thống, vui lòng thử lại",
};

export const TIMEOUT_ERROR: BeError = {
  status: 0,
  code: "TIMEOUT",
  message: "Hệ thống phản hồi quá lâu, vui lòng thử lại",
};

export function invalidResponseError(status: number): BeError {
  return { status, code: "INVALID_RESPONSE", message: SERVER_MESSAGE };
}

export function classifyFetchError(error: unknown): BeError {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  return timedOut ? TIMEOUT_ERROR : NETWORK_ERROR;
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readFieldErrors(record: Record<string, unknown> | null): Record<string, string> | undefined {
  const details = asRecord(record?.["details"]);
  if (!details) return undefined;
  const entries = Object.entries(details).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function toBeError(status: number, body: unknown): BeError {
  if (status >= 500) {
    return { status, code: readString(asRecord(body), "errorCode") ?? `HTTP_${status}`, message: SERVER_MESSAGE };
  }
  const record = asRecord(body);
  const message = readString(record, "message");
  const messageIsCode = message !== undefined && CODE_PATTERN.test(message);
  const code = readString(record, "errorCode") ?? (messageIsCode ? message : `HTTP_${status}`);
  const text =
    readString(record, "detail") ??
    (messageIsCode ? undefined : message) ??
    STATUS_MESSAGES[status] ??
    "Yêu cầu không thành công";
  const fieldErrors = readFieldErrors(record);
  return fieldErrors ? { status, code, message: text, fieldErrors } : { status, code, message: text };
}

/** HTTP status a Route Handler should answer with for a backend failure. */
export function toHttpStatus(error: BeError): number {
  return error.status === 0 || error.status >= 500 ? 502 : error.status;
}
