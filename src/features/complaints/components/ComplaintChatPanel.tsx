'use client';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/helper';
import { COMPLAINT_PARTY_LABELS } from '../constants/Complaint.constants';
import type { ComplaintAttachment, ComplaintMessage } from '../types/types';
import { ComplaintAttachmentList } from './ComplaintAttachmentList';
import { Text } from '@/components/ui';

interface ComplaintChatPanelProps {
  complaintId: string;
  /** Oldest first, as the BE returns them. */
  messages: ComplaintMessage[];
  /** All attachments of the complaint; each message shows the ones whose `messageId` is its id. */
  attachments: ComplaintAttachment[];
}

const AVATAR: Record<ComplaintMessage['authorType'], { letter: string; className: string }> = {
  ADMIN: { letter: 'C', className: 'bg-primary' },
  MERCHANT: { letter: 'M', className: 'bg-success' },
  USER: { letter: 'U', className: 'bg-warning' },
};

function MessageBubble({ complaintId, message, attachments }: { complaintId: string; message: ComplaintMessage; attachments: ComplaintAttachment[] }) {
  // The merchant's own messages sit on the right, everyone else's on the left.
  const isOwn = message.authorType === 'MERCHANT';
  const avatar = AVATAR[message.authorType];
  return (
    <div className={cn('flex gap-2.5', isOwn && 'flex-row-reverse')}>
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', avatar.className)} aria-hidden>
        {avatar.letter}
      </div>
      <div className={cn('flex max-w-[75%] flex-col gap-1', isOwn && 'items-end')}>
        <Text size="xs" color="muted" weight="medium">
          {message.authorName ?? COMPLAINT_PARTY_LABELS[message.authorType]}
        </Text>
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            isOwn
              ? 'rounded-tr-none bg-primary text-primary-foreground'
              : 'rounded-tl-none border border-border bg-muted text-foreground',
          )}
        >
          {message.content}
        </div>
        <ComplaintAttachmentList complaintId={complaintId} attachments={attachments} className={cn(isOwn && 'justify-end')} />
        <Text size="xs" color="muted">{formatDate(message.createdAt)}</Text>
      </div>
    </div>
  );
}

export function ComplaintChatPanel({ complaintId, messages, attachments }: ComplaintChatPanelProps) {
  if (messages.length === 0) {
    return <Text color="muted" size="sm" className="py-6 text-center">Chưa có tin nhắn nào.</Text>;
  }
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          complaintId={complaintId}
          message={message}
          attachments={attachments.filter((attachment) => attachment.messageId === message.id)}
        />
      ))}
    </div>
  );
}

export default ComplaintChatPanel;
