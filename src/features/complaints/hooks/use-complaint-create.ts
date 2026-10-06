'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function useComplaintCreate() {
  const [open, setOpen] = useState(false);

  const submit = () => {
    toast.info('Chức năng tạo khiếu nại chưa được hỗ trợ');
  };

  return { open, setOpen, submit };
}
