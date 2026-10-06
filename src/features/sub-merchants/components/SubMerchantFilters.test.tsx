// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubMerchantFilters } from './SubMerchantFilters';

afterEach(cleanup);

it('clears both filters and searches without filters', async () => {
  const onSearch = vi.fn();
  render(<SubMerchantFilters onSearch={onSearch} defaultValues={{ keyword: 'Shop', status: 'ACTIVE' }} />);

  expect(screen.getByRole('textbox', { name: 'Tên / Mã sub-merchant' })).toHaveValue('Shop');
  expect(screen.getByRole('combobox', { name: 'Trạng thái' })).toHaveTextContent('Đang hoạt động');

  await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

  expect(screen.getByRole('textbox', { name: 'Tên / Mã sub-merchant' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Trạng thái' })).toHaveTextContent('Tất cả trạng thái');
  expect(onSearch).toHaveBeenCalledExactlyOnceWith({});
});
