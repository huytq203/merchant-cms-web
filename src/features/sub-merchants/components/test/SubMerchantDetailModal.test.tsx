// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantDetailModal } from '../SubMerchantDetailModal';
import type { SubMerchantDetail } from '../../types';

afterEach(cleanup);

const detail: SubMerchantDetail = {
  id: 'one',
  code: 'MC000001-S002',
  name: 'Cửa hàng Quận 1',
  businessField: 'Bán lẻ',
  mccCode: '5311',
  status: 'ACTIVE',
  isDefault: true,
  lockSource: null,
  merchantId: 'merchant',
  merchantCode: null,
  merchantName: null,
  legalName: 'Công ty Halotech',
  taxCode: '7493859301345',
  legalRepresentativeName: 'Nguyễn Văn An',
  taxCodeEditable: false,
  phone: { value: '0912345678', source: 'MASTER', inherited: true, suspended: false },
  address: { value: null, source: null, inherited: false, suspended: false },
  createdAt: '2026-10-01T10:14:12',
  updatedAt: '2026-10-02T09:00:00',
};

function renderModal(props: Partial<React.ComponentProps<typeof SubMerchantDetailModal>> = {}) {
  render(<SubMerchantDetailModal open onOpenChange={vi.fn()} detail={detail} {...props} />);
}

describe('SubMerchantDetailModal', () => {
  it('leads with the name, code, status and default flag instead of repeating them in the grid', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Cửa hàng Quận 1' })).toBeInTheDocument();
    expect(screen.getByText('MC000001-S002')).toBeInTheDocument();
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Mặc định')).toBeInTheDocument();
    expect(screen.queryByText('Tên')).not.toBeInTheDocument();
  });

  it('marks the legal block as coming from the Master and notes inherited contact values', () => {
    renderModal();
    expect(screen.getByText('Lấy từ Master')).toBeInTheDocument();
    expect(screen.getByText('7493859301345')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();
    expect(screen.getByText('Kế thừa từ Master')).toBeInTheDocument();
  });

  it('shows "Chưa có" for a missing value', () => {
    renderModal();
    expect(screen.getByText('Chưa có')).toBeInTheDocument();
  });

  it('offers edit and lock from inside the dialog', async () => {
    const onEdit = vi.fn();
    const onLock = vi.fn();
    renderModal({ onEdit, onLock });
    await userEvent.click(screen.getByRole('button', { name: 'Sửa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Khóa Sub-merchant' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('offers unlock instead of lock for a directly locked outlet', async () => {
    const onUnlock = vi.fn();
    renderModal({ detail: { ...detail, status: 'INACTIVE', lockSource: 'DIRECT' }, onLock: vi.fn(), onUnlock });
    expect(screen.queryByRole('button', { name: 'Khóa Sub-merchant' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mở khóa' }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('offers no lock or unlock when the Master locked the outlet', () => {
    renderModal({ detail: { ...detail, status: 'INACTIVE', lockSource: 'CASCADE' }, onLock: vi.fn(), onUnlock: vi.fn() });
    expect(screen.queryByRole('button', { name: /Khóa Sub-merchant|Mở khóa/ })).not.toBeInTheDocument();
  });

  it('shows the industry name together with its MCC code', () => {
    renderModal();
    expect(screen.getByText('Bán lẻ (MCC 5311)')).toBeInTheDocument();
  });

  it('warns when the Sub must have its own contract but has none', () => {
    renderModal({ detail: { ...detail, contractRequired: true, contractFile: null } });
    expect(screen.getByRole('status')).toHaveTextContent('Sub-merchant chưa có hợp đồng riêng');
  });

  it('shows the contract with a view link instead of the warning once it exists', () => {
    const contractFile = { id: 'aaaaaaaa-0000-4000-8000-000000000001', filename: 'hop-dong.pdf', contentType: 'application/pdf', url: 'https://s3.example/hop-dong.pdf?sig=x', urlExpiresAt: '2099-01-01T00:00:00Z' };
    renderModal({ detail: { ...detail, contractRequired: true, contractFile } });
    expect(screen.getByRole('link', { name: 'Xem hop-dong.pdf' })).toHaveAttribute('href', contractFile.url);
    expect(screen.queryByText('Sub-merchant chưa có hợp đồng riêng')).not.toBeInTheDocument();
  });

  it('has no contract section when the Master does not sign per Sub and no file exists', () => {
    renderModal();
    expect(screen.queryByText('Hợp đồng riêng')).not.toBeInTheDocument();
  });
});
