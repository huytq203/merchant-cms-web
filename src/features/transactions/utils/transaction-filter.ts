import { paymentMethodSchema, transactionStatusSchema, transactionTypeSchema, type TransactionFilterValues } from "../schemas/transaction.schema";
import type { TransactionListFilter } from "../types";

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
export function formValuesToFilter(values: TransactionFilterValues, pageSize: number): TransactionListFilter {
  const status = transactionStatusSchema.safeParse(values.status);
  const type = transactionTypeSchema.safeParse(values.type);
  const paymentMethod = paymentMethodSchema.safeParse(values.paymentMethod);
  const keyword = cleanText(values.keyword);
  const customerContact = cleanText(values.customerContact);
  const subMerchantId = cleanText(values.subMerchantId);
  const bankCode = cleanText(values.bankCode);
  return {
    page: 1,
    pageSize,
    ...(keyword ? { keyword } : {}),
    ...(customerContact ? { customerContact } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(type.success ? { type: type.data } : {}),
    ...(paymentMethod.success ? { paymentMethod: paymentMethod.data } : {}),
    ...(subMerchantId ? { subMerchantId } : {}),
    ...(bankCode ? { bankCode } : {}),
    ...(values.createdFrom ? { createdFromDate: values.createdFrom.toISOString() } : {}),
    ...(values.createdTo ? { createdToDate: endOfDay(values.createdTo).toISOString() } : {}),
  };
}

/** URL filter back to form values, so the form shows what is applied. */
export function filterToFormValues(filter: TransactionListFilter): TransactionFilterValues {
  return {
    keyword: filter.keyword ?? "",
    customerContact: filter.customerContact ?? "",
    status: filter.status ?? "",
    type: filter.type ?? "",
    paymentMethod: filter.paymentMethod ?? "",
    subMerchantId: filter.subMerchantId ?? "",
    bankCode: filter.bankCode ?? "",
    createdFrom: filter.createdFromDate ? new Date(filter.createdFromDate) : null,
    createdTo: filter.createdToDate ? new Date(filter.createdToDate) : null,
  };
}
