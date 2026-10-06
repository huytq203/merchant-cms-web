'use client';
import {
  Button,
  ComboBox,
  DatePicker,
  Form,
  FormField,
  Input,
} from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SubMerchantFilterField } from '@/features/sample-data/components/SubMerchantFilterField';
import {
  PAYMENT_METHOD_OPTIONS,
  TRANSACTION_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from '../constants/Transaction.constants';
import { transactionFilterSchema, type TransactionFilterValues } from '../schemas/transaction.schema';

interface TransactionFiltersProps {
  onSearch: (values: TransactionFilterValues) => void;
  defaultValues?: TransactionFilterValues;
  /** Hidden in fixture mode: fixture sub-merchant ids are not the BE ids this list offers. */
  showSubMerchant?: boolean;
}

const EMPTY_VALUES: TransactionFilterValues = {
  keyword: '',
  customerContact: '',
  status: '',
  type: '',
  paymentMethod: '',
  subMerchantId: '',
  bankCode: '',
  createdFrom: null,
  createdTo: null,
};

const STATUS_OPTIONS = TRANSACTION_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

const firstValue = (value: string | string[]) => (typeof value === 'string' ? value : (value[0] ?? ''));

export function TransactionFilters({ onSearch, defaultValues, showSubMerchant = true }: TransactionFiltersProps) {
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
      <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            name="type"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete={false}
                label="Loại giao dịch"
                placeholder="Tất cả loại giao dịch"
                value={field.value ?? ''}
                onValueChange={(value) => field.onChange(firstValue(value))}
                options={TRANSACTION_TYPE_OPTIONS}
              />
            )}
          />
          <FormField
            name="createdFrom"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Từ ngày (tạo)"
                placeholder="Chọn ngày bắt đầu"
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date instanceof Date ? date : null)}
              />
            )}
          />
          <FormField
            name="createdTo"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Đến ngày (tạo)"
                placeholder="Chọn ngày kết thúc"
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date instanceof Date ? date : null)}
                error={form.formState.errors.createdTo?.message}
              />
            )}
          />
          <FormField
            name="keyword"
            control={form.control}
            render={({ field }) => (
              <Input
                label="Mã giao dịch / HĐ"
                placeholder="Nhập mã giao dịch..."
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
          <FormField
            name="status"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete={false}
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                value={field.value ?? ''}
                onValueChange={(val) => field.onChange(firstValue(val))}
                options={STATUS_OPTIONS}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {showSubMerchant && (
            <FormField
              name="subMerchantId"
              control={form.control}
              render={({ field }) => (
                <SubMerchantFilterField value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          )}
          <FormField
            name="paymentMethod"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete={false}
                label="Phương thức TT"
                placeholder="Tất cả phương thức"
                value={field.value ?? ''}
                onValueChange={(value) => field.onChange(firstValue(value))}
                options={PAYMENT_METHOD_OPTIONS}
              />
            )}
          />
          <FormField
            name="customerContact"
            control={form.control}
            render={({ field }) => (
              <Input
                label="SĐT / Email KH"
                placeholder="Ví dụ: 0912345678 hoặc ten@congty.vn"
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleReset}>
            Xóa lọc
          </Button>
          <Button type="submit" variant="solid">
            Tìm kiếm
          </Button>
        </div>
      </form>
    </Form>
  );
}
