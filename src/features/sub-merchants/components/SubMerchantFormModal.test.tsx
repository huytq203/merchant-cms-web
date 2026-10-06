// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantFormModal } from './SubMerchantFormModal';
import type { SubMerchantDetail } from '../types';
afterEach(cleanup);
const ownField = { source: null, inherited: false, suspended: false };
const detail: SubMerchantDetail = {
  id: 'one',
  code: 'SM001',
  name: 'Shop',
  businessField: null,
  status: 'ACTIVE',
  isDefault: false,
  lockSource: null,
  merchantId: 'merchant',
  merchantCode: null,
  merchantName: null,
  legalName: 'Legal',
  taxCode: '123',
  legalRepresentativeName: 'Owner',
  taxCodeEditable: false,
  phone: { value: '123', ...ownField },
  address: { value: 'Addr', ...ownField },
  createdAt: null,
  updatedAt: null,
};
it('omits phone when inheritance is selected', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Tên điểm bán/ }), 'Shop');
  await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa điện thoại/ }));
  await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa địa chỉ/ }));
  expect(screen.getByRole('textbox', { name: /Số điện thoại/ })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ inheritPhone: true }));
  expect(onSubmit).toHaveBeenCalledWith(expect.not.objectContaining({ phone: expect.anything() }));
});
it('requires a phone when inheritance is off', async () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
  expect(await screen.findByText('Nhập số điện thoại hoặc chọn kế thừa')).toBeInTheDocument();
});
it('validates names over 255 characters', async () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Tên điểm bán/ }), 'a'.repeat(256));
  await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
  expect(await screen.findByText('Tối đa 255 ký tự')).toBeInTheDocument();
});
it('shows KYB only as read-only detail while editing', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} editTarget={detail} />);
  expect(screen.getByText('123')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Mã số thuế/ })).not.toBeInTheDocument();
});
it('shows a save error inside an alert', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} error="Tên điểm bán đã tồn tại" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Tên điểm bán đã tồn tại');
});
