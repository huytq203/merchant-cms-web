'use client';
import { Button, ComboBox, Form, FormField, Input } from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import useDebounce from '@/hooks/useDebounce';
import { RotateCcw } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { SUB_MERCHANT_STATUS_OPTIONS } from '../constants/SubMerchant.constants';
import { subMerchantFilterSchema, type SubMerchantFilterValues } from '../schemas';

interface SubMerchantFiltersProps {
  onSearch: (values: SubMerchantFilterValues) => void;
  defaultValues?: SubMerchantFilterValues;
}

const EMPTY_VALUES: SubMerchantFilterValues = {
  keyword: '',
  status: '',
};

export function SubMerchantFilters({ onSearch, defaultValues }: SubMerchantFiltersProps) {
  const form = useForm<SubMerchantFilterValues>({
    resolver: zodResolver(subMerchantFilterSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const watched = useWatch({ control: form.control });
  const debouncedKeyword = useDebounce(watched.keyword ?? '', 400);

  useEffect(() => {
    const values = form.getValues();
    onSearch({ ...values, keyword: debouncedKeyword });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  useEffect(() => {
    const values = form.getValues();
    onSearch(values);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.status]);

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  return (
    <Form {...form}>
      <form className="space-y-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <FormField
            name="keyword"
            control={form.control}
            render={({ field }) => (
              <Input
                label="Tên / Mã sub-merchant"
                placeholder="Nhập tên hoặc mã..."
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
                options={SUB_MERCHANT_STATUS_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                }))}
              />
            )}
          />
        </div>

        <div className="flex justify-end pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </form>
    </Form>
  );
}
