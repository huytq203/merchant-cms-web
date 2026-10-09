// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantFilters } from '../SubMerchantFilters';

afterEach(cleanup);

describe('SubMerchantFilters', () => {
  it('searches by code, name and status with the BE field names, trimmed', async () => {
    const onSearch = vi.fn();
    render(<SubMerchantFilters onSearch={onSearch} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Mã Sub-merchant' }), ' S001 ');
    await userEvent.type(screen.getByRole('textbox', { name: 'Tên Sub-merchant' }), 'Halo');
    await userEvent.click(screen.getByRole('combobox', { name: 'Trạng thái' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Đang hoạt động' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ code: 'S001', name: 'Halo', status: 'ACTIVE' });
  });

  it('sends nothing for empty fields', async () => {
    const onSearch = vi.fn();
    render(<SubMerchantFilters onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({});
  });

  it('starts from the URL values and clears them all', async () => {
    const onSearch = vi.fn();
    render(<SubMerchantFilters onSearch={onSearch} defaultValues={{ code: 'S001', name: 'Shop', status: 'ACTIVE' }} />);

    expect(screen.getByRole('textbox', { name: 'Mã Sub-merchant' })).toHaveValue('S001');
    expect(screen.getByRole('textbox', { name: 'Tên Sub-merchant' })).toHaveValue('Shop');
    expect(screen.getByRole('combobox', { name: 'Trạng thái' })).toHaveTextContent('Đang hoạt động');

    await userEvent.click(screen.getByRole('button', { name: 'Xóa lọc' }));

    expect(screen.getByRole('textbox', { name: 'Mã Sub-merchant' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tên Sub-merchant' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Trạng thái' })).toHaveTextContent('Tất cả trạng thái');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({});
  });
});
