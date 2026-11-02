import { format, parse } from "date-fns";
import { z } from "zod";
import { paymentMethodSchema, transactionStatusSchema, type TransactionFilterValues } from "../schemas/transaction.schema";
import type { TransactionListFilter } from "../types";

const DAY = "yyyy-MM-dd";

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Form values to the URL filter: back to the first page, empty or unknown values dropped. */
export function formValuesToFilter(values: TransactionFilterValues, pageSize: number): TransactionListFilter {
  const status = transactionStatusSchema.safeParse(values.status);
  const paymentMethod = paymentMethodSchema.safeParse(values.paymentMethod);
  const subMerchantId = z.uuid().safeParse(cleanText(values.subMerchantId));
  const keyword = cleanText(values.keyword);
  return {
    page: 1,
    pageSize,
    ...(keyword ? { keyword } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(paymentMethod.success ? { paymentMethod: paymentMethod.data } : {}),
    ...(subMerchantId.success ? { subMerchantId: subMerchantId.data } : {}),
    // The calendar day the user picked; the BE includes the whole last day.
    ...(values.createdFrom ? { createdFrom: format(values.createdFrom, DAY) } : {}),
    ...(values.createdTo ? { createdTo: format(values.createdTo, DAY) } : {}),
  };
}

/** URL filter back to form values, so the form shows what is applied. */
export function filterToFormValues(filter: TransactionListFilter): TransactionFilterValues {
  return {
    keyword: filter.keyword ?? "",
    status: filter.status ?? "",
    paymentMethod: filter.paymentMethod ?? "",
    subMerchantId: filter.subMerchantId ?? "",
    createdFrom: filter.createdFrom ? parse(filter.createdFrom, DAY, new Date()) : null,
    createdTo: filter.createdTo ? parse(filter.createdTo, DAY, new Date()) : null,
  };
}
