'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ApproveMerchantPayload,
  LockMerchantPayload,
  Merchant,
  RejectMerchantPayload,
} from '../types';

function mockDelay<T>(value: T, ms = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useApproveMerchantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_payload: ApproveMerchantPayload) =>
      mockDelay<{ success: boolean }>({ success: true }),
    onSuccess: (_, variables) => {
      toast.success('Phê duyệt merchant thành công');
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchant', variables.merchantId] });
    },
    onError: () => {
      toast.error('Phê duyệt thất bại, vui lòng thử lại');
    },
  });
}

export function useRejectMerchantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_payload: RejectMerchantPayload) =>
      mockDelay<{ success: boolean }>({ success: true }),
    onSuccess: (_, variables) => {
      toast.success('Đã từ chối hồ sơ merchant');
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchant', variables.merchantId] });
    },
    onError: () => {
      toast.error('Thao tác thất bại, vui lòng thử lại');
    },
  });
}

export function useLockMerchantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_payload: LockMerchantPayload & { action: 'lock' | 'unlock' }) =>
      mockDelay<{ success: boolean }>({ success: true }),
    onSuccess: (_, variables) => {
      const msg = variables.action === 'lock' ? 'Đã khóa merchant' : 'Đã mở khóa merchant';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchant', variables.merchantId] });
    },
    onError: () => {
      toast.error('Thao tác thất bại, vui lòng thử lại');
    },
  });
}

export function useCreateMerchantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_payload: Record<string, unknown>) =>
      mockDelay<Merchant>({} as Merchant),
    onSuccess: () => {
      toast.success('Tạo merchant mới thành công');
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: () => {
      toast.error('Tạo merchant thất bại, vui lòng thử lại');
    },
  });
}
