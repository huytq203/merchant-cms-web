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
import mockData from '@/mock/data-merchant.json';
import { merchantFilterSchema, type MerchantFilterValues } from '../schemas';

interface MerchantFiltersProps {
  onSearch: (values: MerchantFilterValues) => void;
  defaultValues?: MerchantFilterValues;
}

const STATUS_OPTIONS = [
  { label: 'Hoạt động', value: 'active' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Bị khóa', value: 'locked' },
  { label: 'Ngừng hợp tác', value: 'inactive' },
  { label: 'Chưa hoàn thiện', value: 'incomplete' },
];

const BUSINESS_TYPE_OPTIONS = mockData.businessTypes.map((bt) => ({
  label: bt.label,
  value: bt.value,
}));

const SALES_OPTIONS = mockData.salesStaffs.map((s) => ({
  label: s.name,
  value: s.id,
}));

export function MerchantFilters({ onSearch, defaultValues }: MerchantFiltersProps) {
  const form = useForm<MerchantFilterValues>({
    resolver: zodResolver(merchantFilterSchema),
    defaultValues: {
      keyword: defaultValues?.keyword ?? '',
      businessType: defaultValues?.businessType ?? '',
      status: defaultValues?.status ?? '',
      salesStaffId: defaultValues?.salesStaffId ?? '',
      registeredFrom: defaultValues?.registeredFrom ?? null,
      registeredTo: defaultValues?.registeredTo ?? null,
      activatedFrom: defaultValues?.activatedFrom ?? null,
      activatedTo: defaultValues?.activatedTo ?? null,
    },
  });

  const handleReset = () => {
    form.reset({
      keyword: '',
      businessType: '',
      status: '',
      salesStaffId: '',
      registeredFrom: null,
      registeredTo: null,
      activatedFrom: null,
      activatedTo: null,
    });
    onSearch({});
  };

  const registeredFrom = useWatch({ control: form.control, name: 'registeredFrom' });
  const registeredTo = useWatch({ control: form.control, name: 'registeredTo' });
  const activatedFrom = useWatch({ control: form.control, name: 'activatedFrom' });
  const activatedTo = useWatch({ control: form.control, name: 'activatedTo' });

  const validateDateRange = (from: Date | null | undefined, to: Date | null | undefined) => {
    if (from && to && from > to) return 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc';
    return undefined;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            name="keyword"
            control={form.control}
            render={({ field }) => (
              <Input
                label="Tìm kiếm nhanh"
                placeholder="Tên, mã MC, email, SĐT"
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
          <FormField
            name="businessType"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete={false}
                label="Lĩnh vực kinh doanh"
                placeholder="Tất cả lĩnh vực"
                value={field.value ?? ''}
                onValueChange={(val) => field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))}
                options={BUSINESS_TYPE_OPTIONS}
              />
            )}
          />
          <FormField
            name="salesStaffId"
            control={form.control}
            render={({ field }) => (
              <ComboBox
                autocomplete
                label="Nhân viên Sales"
                placeholder="Tất cả nhân viên"
                value={field.value ?? ''}
                onValueChange={(val) => field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))}
                options={SALES_OPTIONS}
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
                onValueChange={(val) => field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))}
                options={STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            name="registeredFrom"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Ngày đăng ký (từ)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
                description={validateDateRange(registeredFrom, registeredTo)}
              />
            )}
          />
          <FormField
            name="registeredTo"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Ngày đăng ký (đến)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
              />
            )}
          />
          <FormField
            name="activatedFrom"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Ngày kích hoạt (từ)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
                description={validateDateRange(activatedFrom, activatedTo)}
              />
            )}
          />
          <FormField
            name="activatedTo"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Ngày kích hoạt (đến)"
                placeholder="Chọn ngày"
                date={field.value ?? undefined}
                onDateChange={(d) => field.onChange(d instanceof Date ? d : null)}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="md" onClick={handleReset} leftIcon={<RotateCcw className="h-4 w-4" />}>
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
