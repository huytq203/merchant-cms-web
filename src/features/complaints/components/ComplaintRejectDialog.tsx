'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog/AlertDialog';
import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { describeComplaintError, submitReject } from '../complaint-api';
import { COMPLAINTS_KEY } from '../complaint-queries';
import { MAX_REJECT_REASON, rejectComplaintBodySchema } from '../schemas/complaint.schema';
import type { Complaint } from '../types/types';

type Props = {
  complaint: Pick<Complaint, 'id' | 'complaintCode'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirmation before the merchant rejects a complaint: it closes the complaint as "Từ chối" and cannot be
 * undone, so a reason is mandatory (it becomes the verdict content).
 */
export function ComplaintRejectDialog({ complaint, open, onOpenChange }: Props) {
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reject = useMutation({
    mutationFn: () => submitReject(complaint.id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: COMPLAINTS_KEY }),
  });

  const handleOpenChange = (next: boolean) => {
    if (reject.isPending) return;
    if (!next) {
      setReason('');
      setError(null);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    const parsed = rejectComplaintBodySchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Vui lòng nhập lý do từ chối');
      return;
    }
    setError(null);
    try {
      await reject.mutateAsync();
      toast.success('Đã từ chối khiếu nại');
      setReason('');
      onOpenChange(false);
    } catch (failure) {
      setError(describeComplaintError(failure));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="items-center">
          <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <TriangleAlert className="h-7 w-7 text-warning" aria-hidden="true" />
          </div>
          <AlertDialogTitle className="text-center text-lg">Từ chối khiếu nại?</AlertDialogTitle>
          <AlertDialogDescription className="text-center leading-relaxed">
            Khiếu nại <span className="font-mono font-semibold">{complaint.complaintCode}</span> sẽ kết thúc với kết luận Từ
            chối. <span className="font-medium text-foreground">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          label="Lý do từ chối"
          required
          rows={4}
          maxLength={MAX_REJECT_REASON}
          showCount
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />
        <AlertDialogFooter className="mt-2 gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" size="md" onClick={() => handleOpenChange(false)} disabled={reject.isPending}>
            Quay lại
          </Button>
          <Button variant="danger" size="md" isLoading={reject.isPending} onClick={() => void handleConfirm()}>
            Xác nhận từ chối
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
