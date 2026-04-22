import { useQuery } from '@tanstack/react-query';
import mockData from '@/mock/data-transaction.json';
import type { Transaction, TransactionListFilter, TransactionListResponse } from '../types';

const MOCK_DELAY = 600;

function filterTransactions(filter: TransactionListFilter): TransactionListResponse {
  let results = [...mockData.transactions] as Transaction[];

  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    results = results.filter(
      (t) =>
        t.code.toLowerCase().includes(kw) ||
        t.referenceCode.toLowerCase().includes(kw)
    );
  }
  if (filter.customerContact) {
    const cc = filter.customerContact.toLowerCase();
    results = results.filter(
      (t) =>
        t.customerPhone.includes(cc) ||
        t.customerName.toLowerCase().includes(cc)
    );
  }
  if (filter.status) {
    results = results.filter((t) => t.status === filter.status);
  }
  if (filter.cardType) {
    results = results.filter((t) => t.cardType === filter.cardType);
  }
  if (filter.paymentMethod) {
    results = results.filter((t) => t.paymentMethod === filter.paymentMethod);
  }
  if (filter.subMerchantId) {
    results = results.filter((t) => t.subMerchantId === filter.subMerchantId);
  }
  if (filter.bankCode) {
    results = results.filter((t) => t.bankCode === filter.bankCode);
  }
  if (filter.createdFrom) {
    results = results.filter(
      (t) => new Date(t.createdAt) >= filter.createdFrom!
    );
  }
  if (filter.createdTo) {
    results = results.filter(
      (t) => new Date(t.createdAt) <= filter.createdTo!
    );
  }

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const total = results.length;
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  return { transactions: paged, pagination: { total, page, pageSize } };
}

export function useTransactionsQuery(filter: TransactionListFilter) {
  return useQuery<TransactionListResponse>({
    queryKey: ['transactions', filter],
    queryFn: () =>
      new Promise<TransactionListResponse>((resolve) =>
        setTimeout(() => resolve(filterTransactions(filter)), MOCK_DELAY)
      ),
    staleTime: 30_000,
  });
}
