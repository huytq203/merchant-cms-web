// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantTable } from '../SubMerchantTable';
import type { SubMerchantRow } from '../../types';

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
it('disables cascade unlocks and exposes the reason in a tooltip', async () => {
  render(<SubMerchantTable data={[{ ...base, status: 'INACTIVE', lockSource: 'CASCADE' }]} {...callbacks()} />);
  const action = screen.getByRole('button', { name: 'Mở khóa Shop' });
  expect(action).toBeDisabled();
  await userEvent.hover(action.parentElement!);
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Không thể mở khóa vì Master đang khóa');
});

it('shows the overview: business field, terminal split, masked account with link status, 7-day revenue and created date', () => {
  const row: SubMerchantRow = {
    ...base,
    isDefault: true,
    businessField: 'Bán lẻ',
    terminalCount: 2,
    terminalCountByType: { POS: 1, ONLINE: 0, QR: 1 },
    settlementBankAccount: { bankCode: 'VPB', maskedAccountNo: '*********2111', linkStatus: 'LINKED' },
    revenue7d: 1748000,
    createdAt: '2026-09-28T10:00:00',
  };
  render(<SubMerchantTable data={[row]} {...callbacks()} />);
  expect(screen.getByText('Bán lẻ')).toBeInTheDocument();
  expect(screen.getByText('Mặc định')).toBeInTheDocument();
  expect(screen.getByText('1 QR · 1 POS')).toBeInTheDocument();
  expect(screen.getByText('VPB *********2111')).toBeInTheDocument();
  expect(screen.getByText('Đã liên kết')).toBeInTheDocument();
  expect(screen.getByText(/1\.748\.000/)).toBeInTheDocument();
  expect(screen.getByText('28/09/2026')).toBeInTheDocument();
});
it('shows a usable account that is not the default with a "Chưa đặt TK mặc định" warning instead of "Chưa có TK"', () => {
  // Dev 11/11 (Halo tech): một TK VPB đã liên kết nhưng chưa đặt mặc định; rút tay dùng được, rút tự động thì không.
  const account = { bankCode: 'VPB', maskedAccountNo: '*********2111', linkStatus: 'LINKED' as const, isDefault: false };
  render(<SubMerchantTable data={[{ ...base, settlementBankAccount: account }]} {...callbacks()} />);
  expect(screen.queryByText('Chưa có TK')).not.toBeInTheDocument();
  expect(screen.getByText('VPB *********2111')).toBeInTheDocument();
  expect(screen.getByText('Chưa đặt TK mặc định')).toBeInTheDocument();
});
it('shows no default warning for the default account', () => {
  const account = { bankCode: 'VPB', maskedAccountNo: '*********2111', linkStatus: 'LINKED' as const, isDefault: true };
  render(<SubMerchantTable data={[{ ...base, settlementBankAccount: account }]} {...callbacks()} />);
  expect(screen.queryByText('Chưa đặt TK mặc định')).not.toBeInTheDocument();
});
it('says "Chưa có TK" and shows zero revenue for a Sub without an account or payments', () => {
  render(<SubMerchantTable data={[{ ...base, settlementBankAccount: null, terminalCount: 0, revenue7d: 0 }]} {...callbacks()} />);
  expect(screen.getByText('Chưa có TK')).toBeInTheDocument();
  expect(screen.getByText(/^0 vnđ$/)).toBeInTheDocument();
});
