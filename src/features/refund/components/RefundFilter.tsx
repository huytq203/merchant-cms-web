"use client";
import {
  Button,
  ComboBox,
  DatePicker,
  Form,
  FormField,
  FormItem,
  Input,
  Text,
} from "@/components/ui";
import { useForm } from "react-hook-form";
import { REFUND_STATUS_OPTIONS } from "../constants/Refund.constants";
import { RefundFilterValue } from "../schemas/Refund.schema";
import { useSubMerchants } from "@/features/refund/hooks/use-sub-merchants";

interface RefundFilterProps {
  onSearch: (values: RefundFilterValue) => void;
  defaultValues?: RefundFilterValue;
}

const EMPTY_VALUES: RefundFilterValue = {
  keyword: "",
  invoiceCode: "",
  transactionCode: "",
  status: "",
  subMerchantId: "",
  createdFromDate: null,
  createdToDate: null,
};

const RefundFilter = ({ onSearch, defaultValues }: RefundFilterProps) => {
  const form = useForm<RefundFilterValue>({
    defaultValues: {
      ...EMPTY_VALUES,
      ...defaultValues,
    },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  const { data: dataSubMerchants } = useSubMerchants();
  const listSubMerchant = dataSubMerchants?.data.map((item) => {
    return {
      value: item.id,
      label: item.name,
    };
  });
  const STATUS_SELECT = [...REFUND_STATUS_OPTIONS];

  return (
    <Form {...form}>
      <form
        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        onSubmit={form.handleSubmit((values) => {
          const trimmed = Object.fromEntries(
            Object.entries(values).map(([key, val]) => [
              key,
              typeof val === "string" ? val.trim() : val,
            ]),
          );
          onSearch(trimmed as RefundFilterValue);
        })}
      >
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <Input
              {...field}
              label="Mã hoàn tiền /GD gốc"
              placeholder="Search..."
              value={field.value ?? ""}
            />
          )}
        />
        <FormField
          control={form.control}
          name="invoiceCode"
          render={({ field }) => (
            <Input
              {...field}
              label="Mã hóa đơn"
              placeholder="Mã hóa đơn..."
              value={field.value ?? ""}
            />
          )}
        />
        <FormField
          control={form.control}
          name="subMerchantId"
          render={({ field }) => (
            <ComboBox
              value={field.value ?? ""}
              label="Submerchant"
              onValueChange={(val) =>
                field.onChange(typeof val === "string" ? val : (val[0] ?? ""))
              }
              options={listSubMerchant || []}
              placeholder="Chọn Sub Merchant"
            />
          )}
        />
        <FormField
          control={form.control}
          name="createdFromDate"
          render={({ field }) => (
            <DatePicker
              label="Thời gian từ"
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
              value={field.value ?? undefined}
              onChange={(d) => field.onChange(d instanceof Date ? d : null)}
            />
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <ComboBox
              label="Trạng thái phê duyệt"
              value={field.value}
              onValueChange={(val) =>
                field.onChange(typeof val === "string" ? val : (val[0] ?? ""))
              }
              options={STATUS_SELECT}
              placeholder="Trạng thái phê duyệt"
            />
          )}
        />
        <div className="flex items-center gap-2 justify-end col-span-full ">
          <Button type="reset" variant={"outline"} onClick={handleReset}>
            Xóa lọc
          </Button>
          <Button type="submit">Tìm kiếm</Button>
        </div>
      </form>
    </Form>
  );
};

export default RefundFilter;
