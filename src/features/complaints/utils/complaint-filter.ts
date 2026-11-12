import { format, parse } from "date-fns";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import {
  complaintPartySchema,
  complaintStatusSchema,
  type ComplaintFilterValues,
} from "../schemas/complaint.schema";
import type { ComplaintListFilter } from "../types/types";

const DAY = "yyyy-MM-dd";

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Form values to the URL filter: back to the first page, empty or unknown values dropped. */
export function formValuesToFilter(values: ComplaintFilterValues, pageSize: number): ComplaintListFilter {
  const status = complaintStatusSchema.safeParse(values.status);
  const waitingOn = complaintPartySchema.safeParse(values.waitingOn);
  const reporterType = complaintPartySchema.safeParse(values.reporterType);
  const subMerchantIds = formatSubMerchantIds(parseSubMerchantIds(values.subMerchantIds ?? []));
  const keyword = cleanText(values.keyword);
  return {
    page: 1,
    pageSize,
    ...(keyword ? { keyword } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(waitingOn.success ? { waitingOn: waitingOn.data } : {}),
    ...(reporterType.success ? { reporterType: reporterType.data } : {}),
    ...(subMerchantIds ? { subMerchantIds } : {}),
    // The calendar day the user picked (Vietnam time on the BE); the BE includes the whole last day.
    ...(values.createdFrom ? { createdFrom: format(values.createdFrom, DAY) } : {}),
    ...(values.createdTo ? { createdTo: format(values.createdTo, DAY) } : {}),
  };
}

/** URL filter back to form values, so the form shows what is applied. */
export function filterToFormValues(filter: ComplaintListFilter): ComplaintFilterValues {
  return {
    keyword: filter.keyword ?? "",
    status: filter.status ?? "",
    waitingOn: filter.waitingOn ?? "",
    reporterType: filter.reporterType ?? "",
    subMerchantIds: parseSubMerchantIds(filter.subMerchantIds),
    createdFrom: filter.createdFrom ? parse(filter.createdFrom, DAY, new Date()) : null,
    createdTo: filter.createdTo ? parse(filter.createdTo, DAY, new Date()) : null,
  };
}

/**
 * The BE query of a filter, shared by the list and the export: `pageSize` becomes `size`, and the export
 * sends no paging at all. Undefined values are dropped by the BE client.
 */
export function toBeComplaintQuery(filter: ComplaintListFilter, options: { paged: boolean }) {
  return {
    ...(options.paged ? { page: filter.page, size: filter.pageSize } : {}),
    keyword: filter.keyword,
    status: filter.status,
    waitingOn: filter.waitingOn,
    reporterType: filter.reporterType,
    subMerchantIds: filter.subMerchantIds,
    createdFrom: filter.createdFrom,
    createdTo: filter.createdTo,
  };
}
