// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantFormModal } from '../SubMerchantFormModal';
import type { SubMerchantDetail } from '../../types';
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
const sourceGroup = (name: RegExp) => within(screen.getByRole('group', { name }));

it('inherits phone and address from the Master by default and omits them on submit', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} />);
  expect(screen.getByText(/Mã Sub-merchant do hệ thống cấp sau khi tạo/)).toBeInTheDocument();
  expect(screen.getAllByText('Master')).toHaveLength(2);
  expect(screen.queryByRole('textbox', { name: /Số điện thoại/ })).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'Shop');
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ inheritPhone: true, inheritAddress: true }));
  expect(onSubmit).toHaveBeenCalledWith(expect.not.objectContaining({ phone: expect.anything() }));
});
it('shows an input once "Nhập riêng" is chosen, and the explanation again when switching back', async () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);
  await userEvent.click(sourceGroup(/Nguồn số điện thoại/).getByRole('button', { name: 'Nhập riêng' }));
  expect(screen.getByRole('textbox', { name: /Số điện thoại/ })).toBeEnabled();
  await userEvent.click(sourceGroup(/Nguồn số điện thoại/).getByRole('button', { name: 'Dùng của Master' }));
  expect(screen.queryByRole('textbox', { name: /Số điện thoại/ })).not.toBeInTheDocument();
});
it('requires a phone when "Nhập riêng" is chosen but left empty', async () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'Shop');
  await userEvent.click(sourceGroup(/Nguồn số điện thoại/).getByRole('button', { name: 'Nhập riêng' }));
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(await screen.findByText('Nhập số điện thoại hoặc chọn kế thừa')).toBeInTheDocument();
});
it('validates names over 255 characters', async () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'a'.repeat(256));
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(await screen.findByText('Tối đa 255 ký tự')).toBeInTheDocument();
});
it('shows KYB only as read-only detail while editing', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} editTarget={detail} />);
  expect(screen.getByText('123')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Mã số thuế/ })).not.toBeInTheDocument();
});
it('shows a save error inside an alert', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} error="Tên Sub-merchant đã tồn tại" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Tên Sub-merchant đã tồn tại');
});
it('says the contact comes from the Master while inheriting, next to the read-only legal block', () => {
  const inherited = { ...detail, phone: { value: '0911111111', source: 'MASTER', inherited: true, suspended: false } };
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} editTarget={inherited} />);
  expect(screen.queryByRole('textbox', { name: /Số điện thoại/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Số điện thoại sẽ lấy từ/)).toBeInTheDocument();
  expect(screen.getByText('Lấy từ Master, không sửa tại đây')).toBeInTheDocument();
  expect(screen.getByText('SM001')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeInTheDocument();
});
it('lets the user type their own phone once inheritance is turned off', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} editTarget={detail} />);
  expect(screen.getByRole('textbox', { name: /Số điện thoại/ })).not.toHaveAttribute('readonly');
  await userEvent.clear(screen.getByRole('textbox', { name: /Số điện thoại/ }));
  await userEvent.type(screen.getByRole('textbox', { name: /Số điện thoại/ }), '0922222222');
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ inheritPhone: false, phone: '0922222222' }));
});
