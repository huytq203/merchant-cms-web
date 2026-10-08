// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from '@/components/ui/input/Input';
import { FormModal, type FormModalProps } from '../FormModal';
import { FormModalField, FormModalGrid } from '../FormModalField';

afterEach(cleanup);

function renderModal(props: Partial<FormModalProps> = {}) {
  const onOpenChange = vi.fn();
  const onSubmit = vi.fn();
  render(
    <FormModal open onOpenChange={onOpenChange} title="Thêm mục" onSubmit={onSubmit} {...props}>
      <FormModalGrid>
        <FormModalField label="Tên" required error={undefined}>
          {(control) => <Input {...control} placeholder="Nhập tên" />}
        </FormModalField>
      </FormModalGrid>
    </FormModal>,
  );
  return { onOpenChange, onSubmit };
}

describe('FormModal', () => {
  it('closes with Escape, the close button and the cancel button', async () => {
    const { onOpenChange } = renderModal();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
    onOpenChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    onOpenChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits through the save button', async () => {
    const { onSubmit } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables saving while a request is running', async () => {
    const { onSubmit } = renderModal({ isSubmitting: true });
    const saving = screen.getByRole('button', { name: 'Đang lưu' });
    expect(saving).toBeDisabled();
    await userEvent.click(saving);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a backend failure as an alert inside the dialog', () => {
    renderModal({ error: 'Không lưu được' });
    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('Không lưu được');
  });

  it('renders the footer note and the description when given', () => {
    renderModal({ footerNote: 'Đã chọn 3 quyền', description: 'Mô tả ngắn' });
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Mô tả ngắn');
    expect(screen.getByText('Đã chọn 3 quyền')).toBeInTheDocument();
  });

  it('marks required fields and links the field error to the control', () => {
    render(
      <FormModal open onOpenChange={vi.fn()} title="Thêm mục" onSubmit={vi.fn()}>
        <FormModalField label="Tên" required error="Nhập tên">
          {(control) => <Input {...control} placeholder="Nhập tên" />}
        </FormModalField>
      </FormModal>,
    );
    const input = screen.getByRole('textbox', { name: /Tên/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Nhập tên');
  });

  it('disables the save button when submitDisabled is set', async () => {
    const { onSubmit } = renderModal({ submitDisabled: true });
    const save = screen.getByRole('button', { name: 'Lưu' });
    expect(save).toBeDisabled();
    await userEvent.click(save);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
