import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/schemas/pagination";
import { DISBURSEMENT_CHANNELS, DISBURSEMENT_STATUSES } from "../utils/disbursement-status";

/** Trần khớp `MerchantOrderFilter` của disbursement và `MerchantPortalDisbursementService` của flex.merchant. */
export const MAX_FILTER_SUBS = 200;
export const MAX_CODE_LENGTH = 100;
const MAX_LIST = 50;

const day = z.iso.date();
const amount = z.number("Số tiền không hợp lệ").int("Số tiền phải là số nguyên").min(0, "Số tiền lọc không được âm");

export const orderStatusSchema = z.enum(DISBURSEMENT_STATUSES);
export const orderChannelSchema = z.enum(DISBURSEMENT_CHANNELS);

/** Các trường lọc đơn lẻ; dùng chung cho form, URL và thân gửi BFF. */
export const orderFilterFields = {
  code: z.string().trim().max(MAX_CODE_LENGTH, `Mã tìm kiếm tối đa ${MAX_CODE_LENGTH} ký tự`).optional(),
  subMerchantIds: z.array(z.uuid()).max(MAX_FILTER_SUBS, `Chỉ lọc tối đa ${MAX_FILTER_SUBS} Sub-merchant mỗi lần`).optional(),
  channel: orderChannelSchema.optional(),
  status: orderStatusSchema.optional(),
  bankCode: z.string().trim().min(1).max(20, "Mã ngân hàng tối đa 20 ký tự").optional(),
  amountFrom: amount.optional(),
  amountTo: amount.optional(),
  createdFrom: day.optional(),
  createdTo: day.optional(),
  succeededFrom: day.optional(),
  succeededTo: day.optional(),
  batchId: z.uuid().optional(),
};

/**
 * Bộ lọc form: sai khoảng thì nói rõ bằng tiếng Việt trước khi gọi BE (BE cũng từ chối bằng 400 cùng ý, đây là kiểm
 * sớm để người dùng khỏi chờ).
 */
export const orderFilterFormSchema = z.object(orderFilterFields).superRefine((value, ctx) => {
  if (value.amountFrom !== undefined && value.amountTo !== undefined && value.amountFrom > value.amountTo) {
    ctx.addIssue({ code: "custom", path: ["amountTo"], message: "Số tiền từ phải nhỏ hơn hoặc bằng số tiền đến" });
  }
  if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
    ctx.addIssue({ code: "custom", path: ["createdTo"], message: "Ngày tạo từ phải trước hoặc bằng ngày tạo đến" });
  }
  if (value.succeededFrom && value.succeededTo && value.succeededFrom > value.succeededTo) {
    ctx.addIssue({ code: "custom", path: ["succeededTo"], message: "Ngày thành công từ phải trước hoặc bằng ngày thành công đến" });
  }
});

/**
 * Bộ lọc của BE (`MerchantOrderFilter` trừ masterId/subIds). zod bỏ trường lạ, nên `masterId`/`subIds` nhét vào đây
 * không bao giờ tới BE: phạm vi chỉ đi qua `subIds` ở ngoài và BE kiểm lại với phiên.
 */
const searchFilterSchema = z.object({
  code: orderFilterFields.code,
  channels: z.array(orderChannelSchema).max(MAX_LIST).optional(),
  statuses: z.array(orderStatusSchema).max(MAX_LIST).optional(),
  bankCodes: z.array(z.string().trim().min(1).max(20)).max(MAX_LIST).optional(),
  amountFrom: amount.optional(),
  amountTo: amount.optional(),
  createdFrom: day.optional(),
  createdTo: day.optional(),
  succeededFrom: day.optional(),
  succeededTo: day.optional(),
  batchId: z.uuid().optional(),
  hasReturn: z.boolean().optional(),
  sort: z.enum(["createdAt", "completedAt"]).optional(),
});

const subIdsField = z.array(z.uuid()).max(MAX_FILTER_SUBS, `Chỉ lọc tối đa ${MAX_FILTER_SUBS} Sub-merchant mỗi lần`).optional();

/** Thân `POST /disbursements/search` từ trình duyệt tới BFF (trang 0-based như BE). */
export const orderSearchBodySchema = z.object({
  subIds: subIdsField,
  filter: searchFilterSchema.optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

/** Thân `POST /disbursements/export`: cùng bộ lọc, không phân trang. */
export const orderExportBodySchema = z.object({ subIds: subIdsField, filter: searchFilterSchema.optional() });

export type OrderSearchBodyInput = z.infer<typeof orderSearchBodySchema>;
export type OrderExportBodyInput = z.infer<typeof orderExportBodySchema>;
