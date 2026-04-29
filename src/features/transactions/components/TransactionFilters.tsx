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
import { RotateCcw, Search } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { transactionFilterSchema, type TransactionFilterValues } from '../schemas';

interface TransactionFiltersProps {
  onSearch: (values: TransactionFilterValues) => void;
  defaultValues?: TransactionFilterValues;
}

const STATUS_OPTIONS = [
  { label: 'Thành công', value: 'success' },
  { label: 'Đang xử lý', value: 'pending' },
  { label: 'Thất bại',   value: 'failed' },
  { label: 'Hoàn tiền',  value: 'refunded' },
];

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Thẻ tín dụng',  value: 'credit_card' },
  { label: 'Thẻ ghi nợ',    value: 'debit_card'  },
  { label: 'QR Code',        value: 'qr'          },
];

const SUB_MERCHANT_OPTIONS = [
  { label: 'Cà Phê Khang',           value: 'SM001' },
  { label: 'Fashion Store ABC',       value: 'SM002' },
  { label: 'Tech Solutions VN',       value: 'SM003' },
  { label: 'Siêu Thị Mini Minh Phát', value: 'SM004' },
  { label: 'Lotus Beauty Spa',        value: 'SM005' },
];

const BANK_OPTIONS = [
  { label: 'Vietcombank (VCB)',  value: 'VCB'  },
  { label: 'Techcombank (TCB)', value: 'TCB'  },
  { label: 'MB Bank (MB)',      value: 'MB'   },
  { label: 'BIDV',              value: 'BIDV' },
  { label: 'ACB',               value: 'ACB'  },
  { label: 'TPBank (TPB)',      value: 'TPB'  },
  { label: 'VIB',               value: 'VIB'  },
  { label: 'Agribank (AGRI)',   value: 'AGRI' },
];

const EMPTY_VALUES: TransactionFilterValues = {
  keyword: '',
  customerContact: '',
  status: '',
  paymentMethod: '',
  subMerchantId: '',
  bankCode: '',
  createdFrom: null,
  createdTo: null,
};

export function TransactionFilters({ onSearch, defaultValues }: TransactionFiltersProps) {
  const form = useForm<TransactionFilterValues>({
    resolver: zodResolver(transactionFilterSchema),
    defaultValues: {
      ...EMPTY_VALUES,
      ...defaultValues,
    },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  const createdFrom = useWatch({ control: form.control, name: 'createdFrom' });
  const createdTo   = useWatch({ control: form.control, name: 'createdTo' });

  const dateRangeError =
    createdFrom && createdTo && createdFrom > createdTo
      ? 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
      : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values)=>{
        const strimed=Object.fromEntries(Object.entries(values).map(([key,val])=>[key,(typeof val === 'string') ? val.trim() : val]))
        onSearch(strimed)
      })} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            name="customerContact"
            control={form.control}
            render={({ field }) => (
              <Input
                label="SĐT / Email KH"
                placeholder="Nhập SĐT hoặc email..."
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
                onValueChange={(val) =>
                  field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))
                }
                options={STATUS_OPTIONS}
              />
            )}
          />
          <FormField
            name="paymentMethod"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete={false}
                label="Phương thức TT"
                placeholder="Tất cả phương thức"
                value={field.value ?? ''}
                onValueChange={(val) =>
                  field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))
                }
                options={PAYMENT_METHOD_OPTIONS}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            name="createdFrom"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Từ ngày (Tạo)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
                description={dateRangeError}
              />
            )}
          />
          <FormField
            name="createdTo"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Đến ngày (Tạo)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
              />
            )}
          />
          <FormField
            name="subMerchantId"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete
                label="Sub-merchant"
                placeholder="Tất cả sub-merchant"
                value={field.value ?? ''}
                onValueChange={(val) =>
                  field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))
                }
                options={SUB_MERCHANT_OPTIONS}
              />
            )}
          />
          <FormField
            name="bankCode"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete
                label="Ngân hàng"
                placeholder="Tất cả ngân hàng"
                value={field.value ?? ''}
                onValueChange={(val) =>
                  field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))
                }
                options={BANK_OPTIONS}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Xóa bộ lọc
          </Button>
          <Button type="submit" size="md" leftIcon={<Search className="h-4 w-4" />}>
            Tìm kiếm
          </Button>
        </div>
      </form>
    </Form>
  );
}
