"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, MultiSelect, DatePicker, Form, FormField, Input } from "@/components/ui";
import { useForm } from "react-hook-form";
import { REFUND_STATUS_OPTIONS } from "../constants/Refund.constants";
import { refundFilterSchema, type RefundFilterValue } from "../schemas/Refund.schema";
import { SubMerchantFilterField } from "@/features/sample-data/components/SubMerchantFilterField";

interface RefundFilterProps {
  onSearch: (values: RefundFilterValue) => void;
  defaultValues?: RefundFilterValue;
  /** Hidden in fixture mode: fixture sub-merchant ids are not the BE ids this list offers. */
  showSubMerchant?: boolean;
}

const EMPTY_VALUES: RefundFilterValue = {
  keyword: "",
  invoiceCode: "",
  transactionCode: "",
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
      <form className="space-y-4" onSubmit={form.handleSubmit(onSearch)}>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <Input
                {...field}
                label="Mã hoàn tiền / GD gốc"
                placeholder="Nhập mã hoàn tiền hoặc mã giao dịch..."
                value={field.value ?? ""}
              />
            )}
          />
          <FormField
            control={form.control}
            name="invoiceCode"
            render={({ field }) => (
              <Input {...field} label="Mã hóa đơn" placeholder="Nhập mã hóa đơn..." value={field.value ?? ""} />
            )}
          />
          {showSubMerchant && (
            <FormField
              control={form.control}
              name="subMerchantId"
              render={({ field }) => (
                <SubMerchantFilterField value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          )}
          <FormField
            control={form.control}
            name="createdFromDate"
            render={({ field }) => (
              <DatePicker
                label="Thời gian từ"
                placeholder="Chọn thời gian bắt đầu"
                value={field.value ?? undefined}
                onChange={(d) => field.onChange(d instanceof Date ? d : null)}
              />
            )}
          />
          <FormField
            control={form.control}
            name="createdToDate"
            render={({ field }) => (
              <DatePicker
                label="Thời gian đến"
                placeholder="Chọn thời gian kết thúc"
                value={field.value ?? undefined}
                onChange={(d) => field.onChange(d instanceof Date ? d : null)}
                error={form.formState.errors.createdToDate?.message}
              />
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
};

export default RefundFilter;
