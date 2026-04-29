"use client"
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
import { Download, Filter } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const RefundFilter = () => {
  const form = useForm({
    // resolver: zodResolver(refundFilterFormSchema),
    // defaultValues: {
    //   status: "",
    // },
  });
  return (
      <Form {...form}>
        <form className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => <Input label="Mã hoàn tiền /GD gốc" {...field} placeholder="Search..." />}
          />
          <FormField
            control={form.control}
            name="transactionCode"
            render={({ field }) => (
              <Input {...field} label="Mã giao dịch" placeholder="Mã hóa đơn..." />
            )}
          />
          <FormField
            control={form.control}
            name="subMerchantId"
            render={({ field }) => (
              <ComboBox
                value={field.value}
                label="Submerchant"
                onChange={field.onChange}
                options={[
                  { value: "1", label: "Option 1" },
                  { value: "2", label: "Option 2" },
                ]}
                placeholder="Chọn Sub Merchant"
              />
            )}
          />
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => <DatePicker label="Thời gian từ" onChange={field.onChange} />}
          />
          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => <DatePicker label="Thời gian đến" onChange={field.onChange} />}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <ComboBox
              label="Trạng thái phê duyệt"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "1", label: "Option 1" },
                  { value: "2", label: "Option 2" },
                ]}
                placeholder="Trạng thái phê duyệt"
              />
            )}
          />
          <div className="flex items-center gap-2 justify-end col-span-full ">
            <Button variant={"outline"}>Xóa lọc</Button>
            <Button>Tìm kiếm</Button>
          </div>
        </form>
      </Form>
  );
};

export default RefundFilter;
