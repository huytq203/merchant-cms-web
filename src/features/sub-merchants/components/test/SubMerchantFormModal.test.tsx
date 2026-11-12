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
  mccCode: null,
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

const categories = [
  { value: '5812', label: 'Nhà hàng, ăn uống (MCC 5812)' },
  { value: '5411', label: 'Siêu thị, tạp hóa (MCC 5411)' },
];
const contractFile = { id: 'aaaaaaaa-0000-4000-8000-000000000001', filename: 'hop-dong.pdf', contentType: 'application/pdf', url: 'https://s3.example/hop-dong.pdf?sig=x', urlExpiresAt: '2099-01-01T00:00:00Z' };

it('lets the user pick the industry from the catalogue and submits its MCC code', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} categories={categories} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'Shop');
  await userEvent.click(screen.getByRole('combobox', { name: /Lĩnh vực kinh doanh/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Siêu thị, tạp hóa (MCC 5411)' }));
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ mccCode: '5411' }));
});

it('preselects the Master industry on create without overriding a choice the user already made', async () => {
  const { rerender } = render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} categories={categories} />);
  await userEvent.click(screen.getByRole('combobox', { name: /Lĩnh vực kinh doanh/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Siêu thị, tạp hóa (MCC 5411)' }));
  // Hồ sơ Master về muộn hơn lựa chọn của người dùng: không được ghi đè.
  rerender(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} categories={categories} defaultMccCode="5812" />);
  expect(screen.getByRole('combobox', { name: /Lĩnh vực kinh doanh/ })).toHaveTextContent('Siêu thị, tạp hóa (MCC 5411)');
});

it('shows the saved industry of an existing Sub when editing', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} categories={categories} editTarget={{ ...detail, mccCode: '5812' }} />);
  expect(screen.getByRole('combobox', { name: /Lĩnh vực kinh doanh/ })).toHaveTextContent('Nhà hàng, ăn uống (MCC 5812)');
});

it('does not submit a new Sub without a contract when the Master requires one', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} contractRequired />);
  expect(screen.getByLabelText(/Hợp đồng riêng của Sub-merchant \*/)).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'Shop');
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(await screen.findByText(/vui lòng đính kèm hợp đồng của Sub-merchant/)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('offers an optional contract upload on create when the Master policy is unknown or off', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} />);
  expect(screen.getByLabelText('Hợp đồng riêng của Sub-merchant')).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: /Tên Sub-merchant/ }), 'Shop');
  await userEvent.click(screen.getByRole('button', { name: 'Thêm Sub-merchant' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ contractStagingId: '' }));
});

it('hides the contract section when editing a Sub that is not required to have one', () => {
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} editTarget={{ ...detail, contractRequired: false, contractFile: null }} />);
  expect(screen.queryByText('Hợp đồng riêng của Sub-merchant')).not.toBeInTheDocument();
});

it('shows the existing contract with a link and a replace action when editing a Sub that must have one', async () => {
  const onSubmit = vi.fn();
  render(<SubMerchantFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} editTarget={{ ...detail, contractRequired: true, contractFile }} />);
  expect(screen.getByText('hop-dong.pdf')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Xem hop-dong.pdf' })).toHaveAttribute('href', contractFile.url);
  expect(screen.getByRole('button', { name: /Thay tệp hop-dong.pdf/ })).toBeInTheDocument();
  // Không thay file: lưu vẫn được và không gửi stagingId, BE giữ hợp đồng cũ.
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ contractStagingId: '' }));
});
