import { z } from "zod";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { MAX_CODE_LENGTH, orderChannelSchema, orderStatusSchema } from "../schemas/disbursement-filter.schema";
import type { OrderExportBody, OrderListFilter, OrderSearchBody } from "../types/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

function intParam(value: string | undefined, fallback: number, max = Infinity): number {
  const parsed = value === undefined || value.trim() === "" ? Number.NaN : Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

/** Số tiền trên URL: số nguyên không âm, còn lại bỏ (không đoán ý người dùng). */
function amountParam(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

const dayParam = (value: string | undefined) => {
  const parsed = z.iso.date().safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/**
 * Đọc bộ lọc từ URL của màn danh sách. Giá trị lạ (trạng thái không có, mã lô không phải UUID, ngày sai...) bị bỏ chứ
 * không chuyển tiếp: URL do người dùng gõ nên không được dùng làm đường vào BE. Khoảng đảo (từ > đến) được giữ để form
 * báo lỗi thay vì lặng lẽ đổi chỗ.
 */
export function parseOrderSearchParams(raw: RawSearchParams): OrderListFilter {
  const code = first(raw.code)?.trim().slice(0, MAX_CODE_LENGTH);
  const status = orderStatusSchema.safeParse(first(raw.status));
  const channel = orderChannelSchema.safeParse(first(raw.channel));
  const bankCode = first(raw.bankCode)?.trim();
  const batchId = z.uuid().safeParse(first(raw.batchId));
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  const amountFrom = amountParam(first(raw.amountFrom));
  const amountTo = amountParam(first(raw.amountTo));
  const createdFrom = dayParam(first(raw.createdFrom));
  const createdTo = dayParam(first(raw.createdTo));
  const succeededFrom = dayParam(first(raw.succeededFrom));
  const succeededTo = dayParam(first(raw.succeededTo));
  return {
    page: intParam(first(raw.page), 1),
    pageSize: intParam(first(raw.pageSize), 10, 100),
    ...(code ? { code } : {}),
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    ...(channel.success ? { channel: channel.data } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(bankCode && bankCode.length <= 20 ? { bankCode } : {}),
    ...(amountFrom !== undefined ? { amountFrom } : {}),
    ...(amountTo !== undefined ? { amountTo } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
    ...(succeededFrom ? { succeededFrom } : {}),
    ...(succeededTo ? { succeededTo } : {}),
    ...(batchId.success ? { batchId: batchId.data } : {}),
  };
}

/** URL của màn danh sách cho một bộ lọc. */
export function toOrderSearchParams(filter: OrderListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  };
  set("code", filter.code);
  set("subMerchantIds", formatSubMerchantIds(filter.subMerchantIds));
  set("channel", filter.channel);
  set("status", filter.status);
  set("bankCode", filter.bankCode);
  set("amountFrom", filter.amountFrom);
  set("amountTo", filter.amountTo);
  set("createdFrom", filter.createdFrom);
  set("createdTo", filter.createdTo);
  set("succeededFrom", filter.succeededFrom);
  set("succeededTo", filter.succeededTo);
  set("batchId", filter.batchId);
  return params;
}

/** Bộ lọc → thân export (cùng nội dung với tìm kiếm, không phân trang). Ô để trống không đi vào thân. */
export function toExportBody(filter: OrderListFilter): OrderExportBody {
  const code = filter.code?.trim();
  const body: OrderExportBody = {
    ...(filter.subMerchantIds && filter.subMerchantIds.length > 0 ? { subIds: filter.subMerchantIds } : {}),
    filter: {
      ...(code ? { code } : {}),
      ...(filter.channel ? { channels: [filter.channel] } : {}),
      ...(filter.status ? { statuses: [filter.status] } : {}),
      ...(filter.bankCode ? { bankCodes: [filter.bankCode] } : {}),
      ...(filter.amountFrom !== undefined ? { amountFrom: filter.amountFrom } : {}),
      ...(filter.amountTo !== undefined ? { amountTo: filter.amountTo } : {}),
      ...(filter.createdFrom ? { createdFrom: filter.createdFrom } : {}),
      ...(filter.createdTo ? { createdTo: filter.createdTo } : {}),
      ...(filter.succeededFrom ? { succeededFrom: filter.succeededFrom } : {}),
      ...(filter.succeededTo ? { succeededTo: filter.succeededTo } : {}),
      ...(filter.batchId ? { batchId: filter.batchId } : {}),
    },
  };
  return body;
}

/** Bộ lọc → thân tìm kiếm. URL đánh số trang từ 1, BE từ 0. */
export function toSearchBody(filter: OrderListFilter): OrderSearchBody {
  return { ...toExportBody(filter), page: filter.page - 1, size: filter.pageSize } as OrderSearchBody;
}
