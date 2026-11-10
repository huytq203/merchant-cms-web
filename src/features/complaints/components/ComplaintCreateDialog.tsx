'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import { Input } from '@/components/ui/input/Input';
import { ApiError } from '@/lib/http/api-client';
import { Select } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { formatAmount } from '@/lib/utils/helper';
import { formatVnDateTime } from '@/lib/utils/vn-time';
import { ORDER_STATUS_DISPLAY_OPTIONS, labelOf } from '@/features/orders/constants/Order.constants';
import { checkComplaintTransaction, describeComplaintError, submitComplaint } from '../complaint-api';
import { COMPLAINTS_KEY } from '../complaint-queries';
import { COMPLAINT_REASON_OPTIONS } from '../constants/Complaint.constants';
import { complaintReasonSchema, createComplaintBodySchema, MAX_CREATE_CONTENT } from '../schemas/complaint.schema';
import type { Complaint, TransactionCheck } from '../types/types';
import { ComplaintEvidenceField } from './ComplaintEvidenceField';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Set when opened from a transaction ("Tra soát"): the code is fixed and not typed. Both entries share
   * `POST /complaints` (one module on the BE).
   */
  transactionCode?: string | null;
  /** Mã đơn hàng của đơn đang khiếu nại (nếu đã biết), hiện thêm một dòng cho người dùng đối chiếu. */
  orderCode?: string | null;
  title?: string;
  onCreated?: (complaint: Complaint) => void;
};

type FieldErrors = Partial<Record<'transactionCode' | 'reasonCode' | 'content', string>>;

const EMPTY = { transactionCode: '', reasonCode: '', content: '' };

/** Form checks before any upload, with the same rules the route and the BE apply. */
function validate(values: typeof EMPTY): FieldErrors {
  const parsed = createComplaintBodySchema.safeParse({ ...values, attachmentIds: [] });
  if (parsed.success) return {};
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof FieldErrors;
    errors[field] ??= field === 'reasonCode' ? 'Vui lòng chọn lý do khiếu nại' : issue.message;
  }
  return errors;
}

export function ComplaintCreateDialog({ open, onOpenChange, transactionCode, orderCode, title = 'Tạo khiếu nại mới', onCreated }: Props) {
  const client = useQueryClient();
  const [values, setValues] = useState(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const fixedCode = transactionCode ?? null;
  // The last code the BE refused, with its sentence: submit is stopped for that code without a useless upload.
  const [refused, setRefused] = useState<{ code: string; message: string } | null>(null);
  // Latest typed code, so a slow answer for an older value never paints over a newer one.
  const latestCode = useRef('');
  // Đơn BE tìm được từ mã đã nhập (mã giao dịch hoặc mã đơn hàng), hiện thành thẻ xác nhận dưới ô nhập.
  const [found, setFound] = useState<{ code: string; check: TransactionCheck } | null>(null);

  const create = useMutation({
    mutationFn: submitComplaint,
    onSuccess: () => client.invalidateQueries({ queryKey: COMPLAINTS_KEY }),
  });

  const reset = () => {
    setValues(EMPTY);
    setFiles([]);
    setErrors({});
    setFailure(null);
    setRefused(null);
    setFound(null);
    create.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (create.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const set = (field: keyof typeof EMPTY) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'transactionCode') setFound(null);
  };

  /**
   * Right after the code is typed, ask the BE whether it is a transaction of this merchant, so a wrong code is
   * shown under the field instead of after filling the whole form. Network trouble is not a verdict: only an
   * ApiError with a 4xx status (the BE saying "not yours / not found") marks the field.
   */
  const checkCode = async () => {
    const code = values.transactionCode.trim();
    if (fixedCode || !code) return;
    try {
      const check = await checkComplaintTransaction(code);
      if (latestCode.current === code) {
        setRefused(null);
        setFound({ code, check });
      }
    } catch (error) {
      if (latestCode.current !== code || !(error instanceof ApiError) || error.status >= 500) return;
      const message = describeComplaintError(error);
      setRefused({ code, message });
      setErrors((current) => ({ ...current, transactionCode: message }));
    }
  };

  const handleSubmit = async () => {
    const candidate = { ...values, transactionCode: fixedCode ?? values.transactionCode };
    const found = validate(candidate);
    if (!fixedCode && refused && refused.code === candidate.transactionCode.trim()) found.transactionCode = refused.message;
    setErrors(found);
    setFailure(null);
    const reason = complaintReasonSchema.safeParse(candidate.reasonCode);
    if (Object.keys(found).length > 0 || !reason.success) return;
    try {
      const complaint = await create.mutateAsync({ ...candidate, reasonCode: reason.data, files });
      toast.success(`Đã gửi khiếu nại ${complaint.complaintCode}`);
      reset();
      onOpenChange(false);
      onCreated?.(complaint);
    } catch (error) {
      // The BE sentence as is: 6202 "Mã giao dịch không tồn tại", 6203, 6204, file errors...
      setFailure(describeComplaintError(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {fixedCode ? (
            <p className="text-sm text-muted-foreground">
              {/* Mã cố định luôn là mã giao dịch của đơn (nút Khiếu nại/Tra soát lấy từ đơn): đúng nhãn của nó. */}
              Mã giao dịch: <span className="font-mono font-semibold text-primary">{fixedCode}</span>
              {orderCode ? (
                <>
                  {' · '}Mã đơn hàng: <span className="font-mono font-semibold text-primary">{orderCode}</span>
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Gửi yêu cầu tra soát một giao dịch tới Cổng thanh toán.</p>
          )}
        </DialogHeader>
        <form
          className="mt-5 space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {!fixedCode && (
            <Input
              label="Mã giao dịch hoặc mã đơn hàng"
              placeholder="Nhập mã giao dịch (FM…) hoặc mã đơn hàng"
              required
              value={values.transactionCode}
              onChange={(event) => {
                latestCode.current = event.target.value.trim();
                set('transactionCode')(event.target.value);
              }}
              onBlur={() => void checkCode()}
              error={errors.transactionCode}
            />
          )}
          {!fixedCode && found && found.code === values.transactionCode.trim() ? <FoundOrderCard check={found.check} /> : null}
          <Select
            label="Lý do"
            placeholder="Chọn lý do"
            options={COMPLAINT_REASON_OPTIONS}
            value={values.reasonCode}
            onChange={set('reasonCode')}
            clearable={false}
            error={errors.reasonCode}
          />
          <Textarea
            label="Nội dung khiếu nại"
            placeholder="Mô tả nội dung khiếu nại và thông tin liên quan"
            rows={4}
            maxLength={MAX_CREATE_CONTENT}
            showCount
            required
            value={values.content}
            onChange={(event) => set('content')(event.target.value)}
            error={errors.content}
          />
          <ComplaintEvidenceField value={files} onChange={setFiles} disabled={create.isPending} />
          {failure && (
            <p role="alert" className="text-sm font-medium text-danger">
              {failure}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={create.isPending}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="solid" isLoading={create.isPending}>
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Thẻ xác nhận đơn tìm được: mã đơn hàng, mã giao dịch, Sub · terminal · số tiền · trạng thái · thời điểm thanh toán. */
function FoundOrderCard({ check }: { check: TransactionCheck }) {
  const parts = [
    check.subMerchantName,
    check.terminalCode,
    check.amount == null ? null : formatAmount(check.amount),
    labelOf(ORDER_STATUS_DISPLAY_OPTIONS, check.status),
    check.paidAt ? formatVnDateTime(check.paidAt) : null,
  ].filter(Boolean);
  return (
    <div role="status" className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
      <p className="font-semibold text-foreground">
        {check.orderCode ? `Đơn ${check.orderCode} · ` : ''}Mã GD <span className="font-mono">{check.transactionCode}</span>
      </p>
      <p className="text-muted-foreground">{parts.join(' · ')}</p>
      {check.status !== 'SUCCESS' ? <p className="mt-1 font-medium text-danger">Chỉ hỗ trợ tra soát giao dịch Thành công</p> : null}
    </div>
  );
}
