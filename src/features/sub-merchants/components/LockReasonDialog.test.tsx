// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogActive } from './DialogActive';
afterEach(cleanup);
it('disables confirmation and shows validation errors outside 10 to 500 characters', async () => {
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
  const reason = screen.getByRole('textbox', { name: /Lý do/ });
  await userEvent.type(reason, 'short');
  expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
  expect(screen.getByText('Lý do phải từ 10 đến 500 ký tự')).toBeInTheDocument();
  await userEvent.clear(reason);
  fireEvent.change(reason, { target: { value: 'a'.repeat(501) } });
  expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
});
it('submits a valid reason', async () => {
  const onConfirm = vi.fn();
  render(<DialogActive open onOpenChange={vi.fn()} onConfirm={onConfirm} />);
  await userEvent.type(screen.getByRole('textbox', { name: /Lý do/ }), 'Reason that is valid');
  await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenCalledWith('Reason that is valid');
});
it('keeps a backend error visible without closing', () => {
  const onOpenChange = vi.fn();
  render(<DialogActive open onOpenChange={onOpenChange} onConfirm={vi.fn()} error="Lý do không hợp lệ" />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Lý do không hợp lệ');
  expect(onOpenChange).not.toHaveBeenCalled();
});
