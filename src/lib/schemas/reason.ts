import { z } from "zod";

export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;
export const REASON_LENGTH_MESSAGE = "Lý do phải từ 10 đến 500 ký tự";

/** Lý do khoá/mở khoá/đề xuất: cắt khoảng trắng hai đầu, dài 10–500 ký tự. */
export const reasonSchema = z
  .string()
  .trim()
  .min(REASON_MIN_LENGTH, REASON_LENGTH_MESSAGE)
  .max(REASON_MAX_LENGTH, REASON_LENGTH_MESSAGE);

/** Body `{ reason }` của các route khoá/mở khoá. */
export const reasonBodySchema = z.object({ reason: reasonSchema });

export type ReasonBody = z.infer<typeof reasonBodySchema>;
