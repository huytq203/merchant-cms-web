'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { Text } from '@/components/ui';

/** The reply composer, pinned at the foot of the detail so it stays in view while the conversation scrolls. */
export function ComplaintReplyBox() {
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
    <div className="flex w-full flex-col gap-2.5">
      <Text as="p" size="sm" color="warning" weight="semibold">
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
  );
}
