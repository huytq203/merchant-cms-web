"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker, Form, FormField, Input, MultiSelect } from "@/components/ui";
import { SubMerchantFilterField } from "@/features/sample-data/components/SubMerchantFilterField";
import { REFUND_STATUS_OPTIONS } from "../constants/Refund.constants";
import { refundFilterSchema, type RefundFilterValue } from "../schemas/Refund.schema";

interface RefundFilterProps {
  onSearch: (values: RefundFilterValue) => void;
  defaultValues?: RefundFilterValue;
  /** Hidden in fixture mode: fixture sub-merchant ids are not the BE ids this list offers. */
  showSubMerchant?: boolean;
}

const EMPTY_VALUES: RefundFilterValue = {
  keyword: "",
  status: [],
  subMerchantId: "",
  createdFromDate: null,
  createdToDate: null,
};

const STATUS_SELECT = REFUND_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

const RefundFilter = ({ onSearch, defaultValues, showSubMerchant = true }: RefundFilterProps) => {
  const form = useForm<RefundFilterValue>({
    resolver: zodResolver(refundFilterSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  return (
    <Form {...form}>
      <FilterCard fieldCount={showSubMerchant ? 4 : 3} onSubmit={() => void form.handleSubmit(onSearch)()} onClear={handleReset}>
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <Input {...field} label="Mã hoàn tiền / GD / hóa đơn" placeholder="Nhập mã cần tìm" value={field.value ?? ""} />
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <MultiSelect
              label="Trạng thái (chọn nhiều)"
              value={field.value}
              onChange={field.onChange}
              clearLabel="Xóa trạng thái đã chọn"
              options={STATUS_SELECT}
              placeholder="Tất cả trạng thái"
            />
          )}
        />
        <FormField
          control={form.control}
          name="createdFromDate"
          render={({ field }) => (
            <DatePicker
              mode="range"
              label="Ngày tạo"
              placeholder="Từ ngày, đến ngày"
              value={field.value ? { from: field.value, to: form.getValues("createdToDate") ?? undefined } : undefined}
              onChange={(value) => {
                const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
                field.onChange(range?.from ?? null);
                form.setValue("createdToDate", range?.to ?? null, { shouldValidate: true });
              }}
              error={form.formState.errors.createdToDate?.message}
            />
          )}
        />
        {showSubMerchant && (
          <FormField
            control={form.control}
            name="subMerchantId"
            render={({ field }) => <SubMerchantFilterField value={field.value ?? ""} onChange={field.onChange} />}
          />
        )}
      </FilterCard>
    </Form>
  );
};

export default RefundFilter;
