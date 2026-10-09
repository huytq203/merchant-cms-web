// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogActive } from '../DialogActive';
import { DialogUnActive } from '../DialogUnActive';
afterEach(cleanup);
it('disables confirmation and shows validation errors outside 10 to 500 characters', async () => {
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
  const reason = screen.getByRole('textbox', { name: /Lý do/ });
  await userEvent.type(reason, 'short');
  expect(screen.getByRole('button', { name: 'Khóa Sub-merchant' })).toBeDisabled();
  expect(screen.getByText('Lý do phải từ 10 đến 500 ký tự')).toBeInTheDocument();
  await userEvent.clear(reason);
  fireEvent.change(reason, { target: { value: 'a'.repeat(501) } });
  expect(screen.getByRole('button', { name: 'Khóa Sub-merchant' })).toBeDisabled();
});
it('submits a valid reason', async () => {
  const onConfirm = vi.fn();
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={onConfirm} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Lý do/ }), 'Reason that is valid');
  await userEvent.click(screen.getByRole('button', { name: 'Khóa Sub-merchant' }));
  expect(onConfirm).toHaveBeenCalledWith('Reason that is valid');
});
it('keeps a backend error visible without closing', () => {
  const onOpenChange = vi.fn();
  render(<DialogActive open onOpenChange={onOpenChange} onConfirm={vi.fn()} error="Lý do không hợp lệ" />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Lý do không hợp lệ');
  expect(onOpenChange).not.toHaveBeenCalled();
});
it('names the outlet being locked and warns that its terminals are locked too', () => {
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={vi.fn()} target={{ code: 'MC01-S002', name: 'Cửa hàng Quận 1' }} />);
  expect(screen.getByText('Cửa hàng Quận 1')).toBeInTheDocument();
  expect(screen.getByText('MC01-S002')).toBeInTheDocument();
  expect(screen.getByRole('note')).toHaveTextContent('terminal');
});
it('counts the reason against the 500 character limit', async () => {
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Lý do/ }), 'Tạm ngừng');
  expect(screen.getByText('9/500')).toBeInTheDocument();
});
it('uses a plain confirm button and no terminal warning when unlocking', async () => {
  const onConfirm = vi.fn();
  render(<DialogUnActive open onOpenChange={vi.fn()} onConfirm={onConfirm} target={{ code: 'MC01-S002', name: 'Cửa hàng Quận 1' }} />);
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: /Lý do mở khóa/ }), 'Đã mở cửa trở lại');
  await userEvent.click(screen.getByRole('button', { name: 'Mở khóa' }));
  expect(onConfirm).toHaveBeenCalledWith('Đã mở cửa trở lại');
});
