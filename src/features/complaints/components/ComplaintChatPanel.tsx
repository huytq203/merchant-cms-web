'use client';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/helper';
import type { ComplaintMessage } from '../types/types';
import { Text } from '@/components/ui';

interface ComplaintChatPanelProps {
  messages: ComplaintMessage[];
}

function MessageBubble({ message }: { message: ComplaintMessage }) {
  const isAdmin = message.role === 'admin';
  return (
    <div className={cn('flex gap-2.5', !isAdmin && 'flex-row-reverse')}>
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
          isAdmin ? 'bg-primary' : 'bg-success',
        )}
      >
        {isAdmin ? 'C' : 'M'}
      </div>
      <div className={cn('max-w-[75%] flex flex-col', !isAdmin && 'items-end')}>
        <Text size='xs' color='muted' weight='medium' >{message.senderName}</Text>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            isAdmin
              ? 'bg-muted border border-border text-foreground rounded-tl-none'
              : 'bg-primary text-primary-foreground rounded-tr-none',
          )}
        >
          {message.content}
        </div>
        <Text size='xs' color='muted' >{formatDate(message.time)}</Text>
      </div>
    </div>
  );
}

export function ComplaintChatPanel({ messages }: ComplaintChatPanelProps) {
  if (messages.length === 0) {
    return <Text color='muted' size='sm' className="py-6 text-center">Chưa có tin nhắn nào.</Text>;
  }
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

export default ComplaintChatPanel;
