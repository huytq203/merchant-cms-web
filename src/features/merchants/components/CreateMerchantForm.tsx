"use client";
import {
  Button,
  Checkbox,
  ComboBox,
  DatePicker,
  FileUpload,
  Form,
  FormField,
  Input,
  Text,
  Textarea,
} from "@/components/ui";
import * as Card from "@/components/ui/card/Card";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  FileText,
  Save,
  User,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import mockData from "@/mock/data-merchant.json";
import { createMerchantSchema, type CreateMerchantValues } from "../schemas";
import { useCreateMerchantMutation } from "../hooks/use-merchant-mutations";
import Link from "next/link";

const MERCHANT_TYPES = [
  { value: "individual", label: "Cá nhân" },
  { value: "household", label: "Hộ kinh doanh" },
  { value: "business", label: "Doanh nghiệp" },
];

export function CreateMerchantForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateMerchantMutation();
  const [isDirty, setIsDirty] = useState(false);
  const [dateExpiry, setDateExpiry] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<CreateMerchantValues>({
    resolver: zodResolver(createMerchantSchema),
    defaultValues: {
      email: "",
      phone: "",
      name: "",
      merchantType: undefined,
      taxCode: "",
      businessType: "",
      copyEmail: false,
      emailReconciliation: "",
      emailInvoice: "",
      address: "",
      representativeName: "",
      representativePosition: "",
      representativeCccd: "",
      representativeCccdExpiry: "",
      representativeOtpPhone: "",
    },
  });

  const watchedMerchantType = useWatch({
    control: form.control,
    name: "merchantType",
  });
  const watchedEmail = useWatch({ control: form.control, name: "email" });
  const watchedCopyEmail = useWatch({
    control: form.control,
    name: "copyEmail",
  });
  const needsTaxAndLicense =
    watchedMerchantType && watchedMerchantType !== "individual";

  useEffect(() => {
    if (watchedCopyEmail && watchedEmail) {
      form.setValue("emailReconciliation", watchedEmail);
      form.setValue("emailInvoice", watchedEmail);
    }
  }, [watchedCopyEmail, watchedEmail, form]);

  const handleSubmit = (values: CreateMerchantValues) => {
    mutate(values as unknown as Record<string, unknown>, {
      onSuccess: () => router.push("/merchants"),
    });
  };

  const handleBack = () => {
    if (isDirty) {
      if (!confirm("Dữ liệu chưa lưu sẽ bị mất. Bạn có chắc muốn thoát?"))
        return;
    }
    router.push("/merchants");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        onChange={() => setIsDirty(true)}
        className="space-y-6"
      >
        {/* Top nav */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-4 w-4 " />}
            ></Button>

            <div>
              <Text as="h1" className="text-xl font-bold text-foreground">
                Thêm mới merchant
              </Text>
              <Text as="p" className="text-sm text-muted-foreground">
                Điền đầy đủ thông tin để tạo hồ sơ merchant
              </Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => form.handleSubmit(() => {})()}
            >
              Lưu nháp
            </Button>
            <Button type="submit" size="md" isLoading={isPending}>
              Hoàn tất & Tạo
            </Button>
          </div>
        </div>

        {/* Section II: Account info */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Thông tin tài khoản
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Email đăng ký"
                  required
                  placeholder="example@domain.com"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="SĐT liên hệ"
                  required
                  placeholder="0901234567"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section III: Business identity */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Định danh doanh nghiệp
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Tên merchant"
                    required
                    placeholder="Tên thương hiệu / cửa hàng"
                    error={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
              <FormField
                name="merchantType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <ComboBox
                    placeholder="-- Chọn loại merchant --"
                    label="Loại merchant"
                    autocomplete={false}
                    required
                    options={MERCHANT_TYPES}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {needsTaxAndLicense && (
                <FormField
                  name="taxCode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Mã số thuế"
                      required
                      placeholder="10 hoặc 13 chữ số"
                      error={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              )}
              <FormField
                name="businessType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <ComboBox
                    placeholder="-- Chọn lĩnh vực kinh doanh --"
                    label="Lĩnh vực kinh doanh"
                    autocomplete={false}
                    required
                    options={mockData.businessTypes}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <FormField
                name="copyEmail"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    label="Sao chép email đăng ký cho email đối soát & hóa đơn"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                name="emailReconciliation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Email đối soát"
                    required
                    placeholder="email@domain.com"
                    error={fieldState.error?.message}
                    disabled={watchedCopyEmail}
                    {...field}
                  />
                )}
              />
              <FormField
                name="emailInvoice"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Email hóa đơn"
                    required
                    placeholder="email@domain.com"
                    error={fieldState.error?.message}
                    disabled={watchedCopyEmail}
                    {...field}
                  />
                )}
              />
            </div>

            <FormField
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Textarea
                  label="Địa chỉ trụ sở"
                  required
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section IV: Representative */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Người đại diện
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="representativeName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Họ và tên"
                  required
                  placeholder="Nguyễn Văn A"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativePosition"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Chức vụ"
                  required
                  placeholder="Giám đốc / Chủ hộ"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativeCccd"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Số CCCD"
                  required
                  placeholder="9 hoặc 12 chữ số"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativeCccdExpiry"
              control={form.control}
              render={({ field, fieldState }) => (
                <DatePicker
                  required
                  label="Ngày hết hạn CCCD"
                  placeholder="Chọn ngày"
                  date={dateExpiry}
                  onDateChange={(d) => setDateExpiry(d as Date | undefined)}
                  disablePastDates
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              name="representativeOtpPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-end">
                    <Input
                      label="SĐT nhận OTP"
                      required
                      placeholder="0901234567"
                      error={fieldState.error?.message}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="shrink-0 text-xs"
                      onClick={() =>
                        form.setValue(
                          "representativeOtpPhone",
                          form.getValues("phone"),
                        )
                      }
                    >
                      Sao chép từ SĐT liên hệ
                    </Button>
                  </div>
                </div>
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section V: Legal documents */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Hồ sơ pháp lý
            </Card.CardTitle>
            <Card.CardDescription>
              Ảnh: JPG/PNG tối đa 5MB · Tài liệu: PDF tối đa 10MB
            </Card.CardDescription>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FileUpload
              showPreview
              previewVariant="fill"
              value={files}
              onChange={setFiles}
              label="CCCD mặt trước"
              description="JPG/PNG tối đa 5MB"
            />
            <FileUpload
              showPreview
              previewVariant="fill"
              value={files}
              onChange={setFiles}
              label="CCCD mặt sau"
              description="JPG/PNG tối đa 5MB"
            />
            <FileUpload
              multiple
              value={files}
              onChange={setFiles}
              label="Ảnh hồ sơ kinh doanh"
              description="JPG/PNG tối đa 5MB"
            />
          </Card.CardContent>
        </Card.Card>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/merchants">
            <Button type="button" variant="outline" size="md">
              Hủy
            </Button>
          </Link>
          <Button type="submit" size="md" isLoading={isPending}>
            Hoàn tất & Tạo
          </Button>
        </div>
      </form>
    </Form>
  );
}
