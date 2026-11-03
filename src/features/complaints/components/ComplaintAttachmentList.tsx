'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { describeComplaintError, fetchAttachmentLink } from '../complaint-api';
import type { ComplaintAttachment } from '../types/types';

type Props = {
  complaintId: string;
  attachments: ComplaintAttachment[];
  className?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Evidence files. A link is asked for on each click: it lives five minutes, so it is opened right away
 * and never kept.
 */
export function ComplaintAttachmentList({ complaintId, attachments, className }: Props) {
  const [opening, setOpening] = useState<string | null>(null);
  if (attachments.length === 0) return null;

  const open = async (attachment: ComplaintAttachment) => {
    setOpening(attachment.id);
    try {
      const link = await fetchAttachmentLink(complaintId, attachment.id);
      // Still within the click's user activation, so the new tab is not treated as a popup.
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(describeComplaintError(error));
    } finally {
      setOpening(null);
    }
  };

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <button
            type="button"
            onClick={() => void open(attachment)}
            disabled={opening === attachment.id}
            aria-label={`Xem chứng từ ${attachment.fileName}`}
            className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{attachment.fileName}</span>
            <span className="shrink-0 text-muted-foreground">{formatSize(attachment.sizeBytes)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
