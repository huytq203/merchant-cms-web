import {
  complaintSourceSchema,
  complaintStatusSchema,
  type ComplaintFilterValues,
} from "../schemas/complaint.schema";
import type { ComplaintListFilter } from "../types/types";

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Form values to the URL filter: back to the first page, empty values dropped. */
export function formValuesToFilter(values: ComplaintFilterValues, pageSize: number): ComplaintListFilter {
  const status = complaintStatusSchema.safeParse(values.status);
  const source = complaintSourceSchema.safeParse(values.source);
  return {
    page: 1,
    pageSize,
    ...(values.keyword?.trim() ? { keyword: values.keyword.trim() } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(source.success ? { source: source.data } : {}),
    ...(values.fromDate ? { createdFromDate: values.fromDate.toISOString() } : {}),
    ...(values.toDate ? { createdToDate: endOfDay(values.toDate).toISOString() } : {}),
  };
}

/** URL filter back to form values, so the form shows what is applied. */
export function filterToFormValues(filter: ComplaintListFilter): ComplaintFilterValues {
  return {
    keyword: filter.keyword ?? "",
    fromDate: filter.createdFromDate ? new Date(filter.createdFromDate) : null,
    toDate: filter.createdToDate ? new Date(filter.createdToDate) : null,
    source: filter.source ?? "",
    status: filter.status ?? "",
  };
}
