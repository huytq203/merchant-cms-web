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
import { checkComplaintTransaction, describeComplaintError, submitComplaint } from '../complaint-api';
import { COMPLAINTS_KEY } from '../complaint-queries';
import { COMPLAINT_REASON_OPTIONS } from '../constants/Complaint.constants';
import { complaintReasonSchema, createComplaintBodySchema, MAX_CREATE_CONTENT } from '../schemas/complaint.schema';
import type { Complaint } from '../types/types';
import { ComplaintEvidenceField } from './ComplaintEvidenceField';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Set when opened from a transaction ("Tra soát"): the code is fixed and not typed. Both entries share
   * `POST /complaints` (one module on the BE).
   */
  transactionCode?: string | null;
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

export function ComplaintCreateDialog({ open, onOpenChange, transactionCode, title = 'Tạo khiếu nại mới', onCreated }: Props) {
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
      await checkComplaintTransaction(code);
      if (latestCode.current === code) setRefused(null);
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
              Giao dịch: <span className="font-mono font-semibold text-primary">{fixedCode}</span>
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
              label="Mã giao dịch cần khiếu nại"
              placeholder="Nhập mã giao dịch"
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
