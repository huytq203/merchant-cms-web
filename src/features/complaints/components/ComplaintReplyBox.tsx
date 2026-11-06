'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { Text } from '@/components/ui';
import { describeComplaintError, submitReply } from '../complaint-api';
import { COMPLAINTS_KEY } from '../complaint-queries';
import { waitingOnLabel } from '../constants/Complaint.constants';
import { MAX_REPLY_CONTENT } from '../schemas/complaint.schema';
import type { Complaint } from '../types/types';
import { ComplaintEvidenceField } from './ComplaintEvidenceField';
import { ComplaintRejectDialog } from './ComplaintRejectDialog';

type Props = { complaint: Pick<Complaint, 'id' | 'complaintCode' | 'waitingOn'> };

/**
 * The reply composer and the "Từ chối" action, pinned at the foot of a PROCESSING complaint. After either
 * write, every complaint query (detail and list) is refetched.
 */
export function ComplaintReplyBox({ complaint }: Props) {
  const client = useQueryClient();
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const reply = useMutation({
    mutationFn: () => submitReply(complaint.id, draft, files),
    onSuccess: () => client.invalidateQueries({ queryKey: COMPLAINTS_KEY }),
  });

  const handleSend = async () => {
    if (!draft.trim() || reply.isPending) return;
    setFailure(null);
    try {
      await reply.mutateAsync();
      toast.success('Đã gửi phản hồi');
      setDraft('');
      setFiles([]);
    } catch (error) {
      // The draft stays so nothing typed is lost.
      setFailure(describeComplaintError(error));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void handleSend();
  };

  const waiting = waitingOnLabel(complaint.waitingOn);

  return (
    <div className="flex w-full flex-col gap-2.5">
      {waiting && (
        <Text as="p" size="sm" color={complaint.waitingOn === 'MERCHANT' ? 'warning' : 'muted'} weight="semibold">
          • {waiting}
        </Text>
      )}
      <Textarea
        aria-label="Nội dung phản hồi"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập nội dung phản hồi cho Cổng... (Ctrl+Enter để gửi)"
        rows={3}
        maxLength={MAX_REPLY_CONTENT}
        showCount
      />
      <ComplaintEvidenceField value={files} onChange={setFiles} disabled={reply.isPending} />
      {failure && (
        <p role="alert" className="text-sm font-medium text-danger">
          {failure}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="danger-outline" className="flex-1" onClick={() => setRejecting(true)} disabled={reply.isPending}>
          Từ chối
        </Button>
        <Button
          variant="solid"
          className="flex-1"
          leftIcon={<Send className="h-4 w-4" />}
          onClick={() => void handleSend()}
          disabled={!draft.trim()}
          isLoading={reply.isPending}
        >
          Gửi phản hồi
        </Button>
      </div>
      <ComplaintRejectDialog complaint={complaint} open={rejecting} onOpenChange={setRejecting} />
    </div>
  );
}
