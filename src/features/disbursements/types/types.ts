import type { z } from "zod";
import type {
  batchAggregateSchema,
  batchDetailSchema,
  batchListItemSchema,
  batchListSchema,
  batchLineSchema,
  batchSummarySchema,
  batchValidateResultSchema,
  nameInquirySchema,
  orderDetailSchema,
  orderItemSchema,
  orderSearchPageSchema,
  overviewSchema,
  previewSchema,
  receivingAccountSchema,
  topupSchema,
  viewSchema,
} from "../schemas/disbursement.schema";

export type DisbursementOverview = z.infer<typeof overviewSchema>;
export type DisbursementService = DisbursementOverview["service"];
export type DisbursementPreview = z.infer<typeof previewSchema>;
export type NameInquiry = z.infer<typeof nameInquirySchema>;
export type DisbursementView = z.infer<typeof viewSchema>;
export type DisbursementTopup = z.infer<typeof topupSchema>;
export type ReceivingAccount = z.infer<typeof receivingAccountSchema>;
export type BatchValidateResult = z.infer<typeof batchValidateResultSchema>;
export type BatchSummaryData = z.infer<typeof batchSummarySchema>;
export type BatchLine = z.infer<typeof batchLineSchema>;
export type BatchDetail = z.infer<typeof batchDetailSchema>;
export type BatchAggregate = z.infer<typeof batchAggregateSchema>;
export type BatchListItem = z.infer<typeof batchListItemSchema>;
export type BatchListResult = z.infer<typeof batchListSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderSearchPage = z.infer<typeof orderSearchPageSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;

// ------------------------------------------------------------------ bộ lọc danh sách lệnh

export type { DisbursementChannel, DisbursementStatus } from "../utils/disbursement-status";
import type { DisbursementChannel, DisbursementStatus } from "../utils/disbursement-status";

/** Bộ lọc màn danh sách lệnh như người dùng thấy (trang 1-based, số tiền là số nguyên VND, ngày yyyy-MM-dd). */
export type OrderListFilter = {
  page: number;
  pageSize: number;
  /** Mã lệnh / mã yêu cầu / mã Ref ngân hàng (khớp đúng). */
  code?: string;
  subMerchantIds?: string[];
  channel?: DisbursementChannel;
  status?: DisbursementStatus;
  bankCode?: string;
  amountFrom?: number;
  amountTo?: number;
  createdFrom?: string;
  createdTo?: string;
  succeededFrom?: string;
  succeededTo?: string;
  batchId?: string;
};

/** Phần bộ lọc người dùng nhập (không có phân trang). */
export type OrderFilterValues = Omit<OrderListFilter, "page" | "pageSize">;

/** Thân gọi `POST /search` (trang 0-based như BE). */
export type OrderSearchBody = {
  subIds?: string[];
  filter: {
    code?: string;
    channels?: DisbursementChannel[];
    statuses?: DisbursementStatus[];
    bankCodes?: string[];
    amountFrom?: number;
    amountTo?: number;
    createdFrom?: string;
    createdTo?: string;
    succeededFrom?: string;
    succeededTo?: string;
    batchId?: string;
  };
  page: number;
  size: number;
};

/** Thân gọi `POST /export`: cùng bộ lọc với tìm kiếm, không phân trang. */
export type OrderExportBody = Omit<OrderSearchBody, "page" | "size">;

export type BatchListFilter = { page: number; pageSize: number; subId?: string; status?: string };

export type TopupListFilter = { page: number; pageSize: number; status?: string };
export type TopupListResult = { rows: DisbursementTopup[]; total: number };

/** Nội dung xin OTP và (cùng khuôn) tạo lệnh: OTP gắn đúng Sub + mã yêu cầu + số tiền + người nhận. */
export type OtpChallengeBody = {
  subId: string;
  merchantRequestCode: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
};

export type NameInquiryBody = {
  subId: string;
  bankCode: string;
  accountNumber: string;
  accountName?: string;
};

export type PreviewBody = { subId: string; amount: number; bankCode: string };

export type CreateBody = OtpChallengeBody & {
  accountName?: string;
  description?: string;
  nameMismatchAccepted: boolean;
  sensitiveOtp: { otpSessionId: string; otp: string };
};
