'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';

const REASONS = [
  { value: 'not_received', label: 'Khách báo chưa nhận hàng' },
  { value: 'fraud', label: 'Nghi ngờ gian lận' },
  { value: 'amount', label: 'Sai lệch số tiền' },
  { value: 'other', label: 'Khác' },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function ComplaintCreateDialog({ open, onOpenChange, onSubmit }: Props) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo khiếu nại mới</DialogTitle>
          <p className="text-sm text-muted-foreground">Gửi yêu cầu tra soát một giao dịch tới Cổng thanh toán.</p>
        </DialogHeader>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            label="Mã giao dịch cần khiếu nại"
            placeholder="Nhập mã giao dịch, ví dụ GD2610120409"
            required
          />
          <Select
            label="Lý do"
            placeholder="Chọn lý do"
            options={REASONS}
            value={reason}
            onChange={setReason}
            clearable={false}
          />
          <Textarea
            label="Ghi chú chi tiết"
            placeholder="Mô tả nội dung khiếu nại và thông tin liên quan"
            description="Càng chi tiết càng được xử lý nhanh."
            rows={3}
            maxLength={500}
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="solid">
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
