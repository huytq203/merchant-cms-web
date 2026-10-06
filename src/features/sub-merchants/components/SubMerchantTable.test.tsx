// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantTable } from './SubMerchantTable';
import type { SubMerchantRow } from '../types';

afterEach(cleanup);
const base: SubMerchantRow = { id: 'one', code: 'SM001', name: 'Shop', status: 'ACTIVE', isDefault: false, lockSource: null, merchantId: null, merchantCode: null, merchantName: null, phone: null, createdAt: null };
const callbacks = () => ({ onViewDetail: vi.fn(), onEdit: vi.fn(), onLock: vi.fn(), onUnlock: vi.fn() });
it('exposes named icon actions and calls the selected action', async () => {
  const actions = callbacks();
  render(<SubMerchantTable data={[base]} {...actions} />);
  await userEvent.click(screen.getByRole('button', { name: /Xem chi tiết Shop/ }));
  await userEvent.click(screen.getByRole('button', { name: /Sửa Shop/ }));
  await userEvent.click(screen.getByRole('button', { name: /Khóa Shop/ }));
  expect(actions.onViewDetail).toHaveBeenCalledWith(base);
  expect(actions.onEdit).toHaveBeenCalledWith(base);
  expect(actions.onLock).toHaveBeenCalledWith(base);
});
it('hides lock actions for terminated rows', () => {
  render(<SubMerchantTable data={[{ ...base, status: 'TERMINATED' }]} {...callbacks()} />);
  expect(screen.queryByRole('button', { name: /Khóa Shop|Mở khóa Shop/ })).not.toBeInTheDocument();
});
it('explains why cascade locked rows cannot be unlocked', () => {
  render(<SubMerchantTable data={[{ ...base, status: 'INACTIVE', lockSource: 'CASCADE' }]} {...callbacks()} />);
  expect(screen.getByRole('button', { name: /Không thể mở khóa vì Master đang khóa/ })).toBeDisabled();
});
