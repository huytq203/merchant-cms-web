'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/helper';
import type { ComplaintMessage } from '../types/types';
import { Text } from '@/components/ui';

interface ComplaintChatPanelProps {
  messages: ComplaintMessage[];
  canReply: boolean;
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

export function ComplaintChatPanel({ messages, canReply }: ComplaintChatPanelProps) {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
    // Chưa có API BE: báo rõ và giữ nguyên nội dung đang soạn thay vì giả vờ đã gửi.
    toast.info('Chức năng gửi phản hồi chưa được hỗ trợ');
  };

  const handleReject = () => {
    toast.info('Chức năng từ chối khiếu nại chưa được hỗ trợ');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <Text color='muted' size='sm'  className=" text-center py-6">Chưa có tin nhắn nào.</Text>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}

      {canReply && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex flex-col gap-2.5">
          <Text as='p' size='sm' color='warning' weight='semibold' >
            • Bạn đang giữ nhiệm vụ xử lý
          </Text>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nội dung phản hồi cho Cổng... (Ctrl+Enter để gửi)"
            rows={3}
            maxLength={500}
            showCount
          />
          <div className="flex gap-2">
            <Button variant="danger-outline" className="flex-1" onClick={handleReject}>
              Từ chối
            </Button>
            <Button
              variant="solid"
              className="flex-1"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleSend}
              disabled={!draft.trim()}
            >
              Gửi phản hồi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintChatPanel;
