"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ComboBox, DatePicker, Form, FormField, Input } from "@/components/ui";
import { useForm } from "react-hook-form";
import { COMPLAINT_SOURCE_OPTIONS, COMPLAINT_STATUS_OPTIONS } from "../constants/Complaint.constants";
import { complaintFilterSchema, type ComplaintFilterValues } from "../schemas/complaint.schema";

interface ComplaintFilterProps {
  onSearch: (values: ComplaintFilterValues) => void;
  defaultValues?: ComplaintFilterValues;
}

const SOURCE_SELECT = COMPLAINT_SOURCE_OPTIONS.map(({ value, label }) => ({ value, label }));
const STATUS_SELECT = COMPLAINT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

const EMPTY_VALUES: ComplaintFilterValues = { keyword: "", fromDate: null, toDate: null, source: "", status: "" };

const firstValue = (value: string | string[]) => (typeof value === "string" ? value : (value[0] ?? ""));

export function ComplaintFilter({ onSearch, defaultValues }: ComplaintFilterProps) {
  const form = useForm<ComplaintFilterValues>({
    resolver: zodResolver(complaintFilterSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSearch)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <Input label="Mã khiếu nại / Mã GD" placeholder="Nhập mã khiếu nại hoặc mã giao dịch" {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <DatePicker
                label="Từ ngày"
                placeholder="Chọn ngày bắt đầu"
                value={field.value ?? undefined}
                onChange={(d) => field.onChange(d instanceof Date ? d : null)}
              />
            )}
          />
          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <DatePicker
                label="Đến ngày"
                placeholder="Chọn ngày kết thúc"
                value={field.value ?? undefined}
                onChange={(d) => field.onChange(d instanceof Date ? d : null)}
                error={form.formState.errors.toDate?.message}
              />
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <ComboBox
                label="Nguồn"
                value={field.value ?? ""}
                onValueChange={(val) => field.onChange(firstValue(val))}
                options={SOURCE_SELECT}
                placeholder="Tất cả nguồn"
              />
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <ComboBox
                label="Trạng thái"
                value={field.value ?? ""}
                onValueChange={(val) => field.onChange(firstValue(val))}
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
}
