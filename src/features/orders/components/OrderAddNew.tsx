'use client';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSubMerchants } from '../hooks/use-sub-merchants';
import {
  Form, FormField,
  Button, Input, Textarea,
  Card, CardContent, CardHeader, CardTitle,
  Separator,
  ComboBox,
} from '@/components/ui';
import { Info, PenLine, RotateCcw } from 'lucide-react';
import { DialogOderQR } from './DialogOderQR';

const EXPIRY_OPTIONS = [
  { label: '15 Phút', value: 15 },
  { label: '1 Giờ', value: 60 },
  { label: '24 Giờ', value: 1440 },
  { label: 'Tùy chỉnh', value: -1 },
];

interface OrderNewFormValues {
  subMerchantId: string;
  productName: string;
  price: number;
  vatRate: number;
  shippingFee: number;
  expiryMinutes: number;
  note: string;
}

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';

export function OrderAddNew() {
  const [qrOpen, setQrOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [selectedExpiry, setSelectedExpiry] = useState(15);

  const { data: subMerchantsData, isLoading: isSubMerchantsLoading } = useSubMerchants();
  const subMerchantOptions = useMemo(
    () => (subMerchantsData?.data ?? []).map((sm) => ({ label: sm.name, value: sm.id })),
    [subMerchantsData],
  );

  const form = useForm<OrderNewFormValues>({
    defaultValues: {
      subMerchantId: '',
      productName: '',
      price: 0,
      vatRate: 0,
      shippingFee: 0,
      expiryMinutes: 15,
      note: '',
    },
  });

  const { setValue } = form;
  const [rawPrice, rawVat, rawShipping] = useWatch({
    control: form.control,
    name: ['price', 'vatRate', 'shippingFee'],
  });
  const price = Number(rawPrice) || 0;
  const vatRate = Number(rawVat) || 0;
  const shippingFee = Number(rawShipping) || 0;
  const vatAmount = Math.round(price * vatRate / 100);
  const total = price + vatAmount + shippingFee;

  const onSubmit = useCallback(() => {
    const url = `https://pay.gateway.vn/checkout/vnp-${Date.now()}`;
    setPaymentUrl(url);
    setQrOpen(true);
  }, []);

  const handleExpirySelect = useCallback((minutes: number) => {
    setSelectedExpiry(minutes);
    if (minutes !== -1) setValue('expiryMinutes', minutes);
  }, [setValue]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tạo Link thanh toán nhanh</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Khởi tạo link thanh toán nhanh cho khách hàng lẻ
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* ── Form card ── */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-primary" /> Thông tin đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <FormField
                  control={form.control}
                  name="subMerchantId"
                  render={({ field }) => (
                    <ComboBox
                      label="Chọn Sub-Merchant (Đơn vị thụ hưởng)"
                      options={subMerchantOptions}
                      placeholder={isSubMerchantsLoading ? 'Đang tải...' : '-- Chọn chi nhánh --'}
                      // disabled={isSubMerchantsLoading}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <Input
                      label="Tên sản phẩm/Dịch vụ"
                      placeholder="Ví dụ: Đơn hàng quần áo, Phí tư vấn chuyên gia..."
                      {...field}
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <Input
                        label="Giá sản phẩm (VND)"
                        type="text"
                        inputMode="numeric"
                        placeholder='0'
                        value={value ? String(value) : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          onChange(digits ? Number(digits) : 0);
                        }}
                        {...rest}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <Input
                        label="Thuế VAT (%)"
                        type="text"
                        inputMode="numeric"
                        placeholder='0'
                        value={value ? String(value) : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          onChange(digits ? Math.min(100, Number(digits)) : 0);
                        }}
                        {...rest}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="shippingFee"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <Input
                        label="Phí vận chuyển (VND)"
                        type="text"
                        inputMode="numeric"
                        placeholder='0'
                        value={value ? String(value) : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          onChange(digits ? Number(digits) : 0);
                        }}
                        {...rest}
                      />
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Hết hạn sau</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPIRY_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant={selectedExpiry === opt.value ? 'solid' : 'outline'}
                          onClick={() => handleExpirySelect(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    {selectedExpiry === -1 && (
                      <Input
                        className="mt-2"
                        type="text"
                        inputMode="numeric"
                        placeholder="Nhập số phút tùy chỉnh"
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setValue('expiryMinutes', digits ? Number(digits) : 0);
                        }}
                      />
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <Textarea
                      label="Ghi chú cho khách hàng"
                      placeholder="Thông tin thêm cho khách hàng khi mở link..."
                      rows={4}
                      {...field}
                    />
                  )}
                />

              </CardContent>
            </Card>

            {/* ── Summary card ── */}
            <Card className="lg:col-span-1 lg:sticky lg:top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tạm tính</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giá sản phẩm:</span>
                  <span>{formatVnd(price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thuế VAT ({vatRate}%):</span>
                  <span>{formatVnd(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span>{formatVnd(shippingFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold">TỔNG CỘNG:</span>
                  <span className="text-xl font-bold text-primary">{formatVnd(total)}</span>
                </div>
                <Button type="submit" className="w-full" leftIcon={<PenLine className="h-4 w-4" />}>
                  Tạo Link Thanh Toán
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => { form.reset(); setSelectedExpiry(15); }}
                >
                  Đặt lại
                </Button>
              </CardContent>
            </Card>

          </div>
        </form>
      </Form>

      <DialogOderQR open={qrOpen} onOpenChange={setQrOpen} paymentUrl={paymentUrl} />
    </div>
  );
}

export default OrderAddNew;
