'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { DateRange } from 'react-day-picker';
import { FilterCard } from '@/components/page/FilterCard';
import { DatePicker, Form, FormField, Input, Select } from '@/components/ui';
import { SubMerchantFilterField } from '@/features/sample-data/components/SubMerchantFilterField';
import { PAYMENT_METHOD_OPTIONS, TRANSACTION_STATUS_OPTIONS } from '../constants/Transaction.constants';
import { transactionFilterSchema, type TransactionFilterValues } from '../schemas/transaction.schema';

interface TransactionFiltersProps {
  onSearch: (values: TransactionFilterValues) => void;
  defaultValues?: TransactionFilterValues;
}

const EMPTY_VALUES: TransactionFilterValues = {
  keyword: '',
  status: '',
  paymentMethod: '',
  subMerchantId: '',
  createdFrom: null,
  createdTo: null,
};

const STATUS_OPTIONS = TRANSACTION_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

/**
 * Filters the BE supports. There is no customer phone field: a bank collection carries no payer phone, so
 * nothing could be matched.
 */
export function TransactionFilters({ onSearch, defaultValues }: TransactionFiltersProps) {
  const form = useForm<TransactionFilterValues>({
    resolver: zodResolver(transactionFilterSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  return (
    <Form {...form}>
      <FilterCard fieldCount={5} actionsInGrid onSubmit={() => void form.handleSubmit(onSearch)()} onClear={handleReset}>
        <FormField
          name="keyword"
          control={form.control}
          render={({ field }) => (
            <Input label="Mã giao dịch / đơn hàng" placeholder="Mã giao dịch, mã đơn, tên Sub-merchant" {...field} value={field.value ?? ''} />
          )}
        />
        <FormField
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select label="Trạng thái" placeholder="Tất cả trạng thái" value={field.value ?? ''} onChange={field.onChange} options={STATUS_OPTIONS} />
          )}
        />
        <FormField
          name="createdFrom"
          control={form.control}
          render={({ field }) => (
            <DatePicker
              mode="range"
              label="Ngày tạo"
              placeholder="Từ ngày, đến ngày"
              value={field.value ? { from: field.value, to: form.getValues('createdTo') ?? undefined } : undefined}
              onChange={(value) => {
                const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
                field.onChange(range?.from ?? null);
                form.setValue('createdTo', range?.to ?? null, { shouldValidate: true });
              }}
              error={form.formState.errors.createdTo?.message}
            />
          )}
        />
        <FormField
          name="subMerchantId"
          control={form.control}
          render={({ field }) => <SubMerchantFilterField value={field.value ?? ''} onChange={field.onChange} />}
        />
        <FormField
          name="paymentMethod"
          control={form.control}
          render={({ field }) => (
            <Select label="Phương thức thanh toán" placeholder="Tất cả phương thức" value={field.value ?? ''} onChange={field.onChange} options={PAYMENT_METHOD_OPTIONS} />
          )}
        />
      </FilterCard>
    </Form>
  );
}
