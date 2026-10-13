import { type RefundFilterValue } from "../schemas/Refund.schema";
import type { RefundListFilter } from "../types/type";

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Form values to the URL filter: back to the first page, empty values dropped. */
export function formValuesToFilter(values: RefundFilterValue, pageSize: number): RefundListFilter {
  const keyword = cleanText(values.keyword);
  const subMerchantId = cleanText(values.subMerchantId);
  return {
    page: 1,
    pageSize,
    ...(keyword ? { keyword } : {}),
    ...(values.status.length ? { status: values.status } : {}),
    ...(subMerchantId ? { subMerchantId } : {}),
    ...(values.createdFromDate ? { createdFromDate: values.createdFromDate.toISOString() } : {}),
    ...(values.createdToDate ? { createdToDate: endOfDay(values.createdToDate).toISOString() } : {}),
  };
}

/** URL filter back to form values, so the form shows what is applied. */
export function filterToFormValues(filter: RefundListFilter): RefundFilterValue {
  return {
    keyword: filter.keyword ?? "",
    status: filter.status ?? [],
    subMerchantId: filter.subMerchantId ?? "",
    createdFromDate: filter.createdFromDate ? new Date(filter.createdFromDate) : null,
    createdToDate: filter.createdToDate ? new Date(filter.createdToDate) : null,
  };
}
