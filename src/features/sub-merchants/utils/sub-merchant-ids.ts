import { z } from "zod";

/** Số Sub tối đa một yêu cầu lọc mang theo; trùng với trần danh sách lựa chọn Sub của BE. */
export const MAX_SUB_MERCHANT_IDS = 500;

const uuid = z.uuid();

const splitIds = (value: string) => value.split(",").map((part) => part.trim()).filter(Boolean);

/**
 * Đọc `subMerchantIds` từ search params (chuỗi nối dấu phẩy hoặc param lặp): bỏ phần tử không phải UUID và trùng.
 * `legacy` là `subMerchantId` cũ — URL đã lưu trước khi chuyển sang chọn nhiều vẫn mở được; `subMerchantIds` thắng khi có cả hai.
 */
export function parseSubMerchantIds(raw: string | string[] | undefined, legacy?: string | string[]): string[] {
  const pick = (value: string | string[] | undefined) => (value === undefined ? [] : (Array.isArray(value) ? value : [value]).flatMap(splitIds));
  const primary = pick(raw);
  const source = primary.length > 0 ? primary : pick(legacy);
  const valid = source.filter((id) => uuid.safeParse(id).success);
  return [...new Set(valid)].slice(0, MAX_SUB_MERCHANT_IDS);
}

/** Giá trị gửi lên URL/BE: nối dấu phẩy; không chọn Sub nào = "Tất cả Sub" = không gửi tham số. */
export function formatSubMerchantIds(ids: readonly string[] | undefined): string | undefined {
  return ids && ids.length > 0 ? ids.join(",") : undefined;
}

/** Schema cho query đã ở dạng chuỗi "a,b" và chỉ được chuyển tiếp nguyên dạng (hoàn tiền, khiếu nại...): từng phần tử phải là UUID. */
export const subMerchantIdsCsv = z
  .string()
  .refine((value) => {
    const parts = splitIds(value);
    return parts.length > 0 && parts.length <= MAX_SUB_MERCHANT_IDS && parts.every((part) => uuid.safeParse(part).success);
  }, "Danh sách Sub-merchant không hợp lệ");

/** Schema cho query của route Next: chuỗi "a,b" → mảng UUID; phần tử sai định dạng là lỗi 400 chứ không bị bỏ ngầm. */
export const subMerchantIdsParam = z
  .string()
  .transform(splitIds)
  .pipe(z.array(uuid).max(MAX_SUB_MERCHANT_IDS))
  .optional();
