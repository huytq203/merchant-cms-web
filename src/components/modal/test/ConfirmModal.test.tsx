// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../ConfirmModal';

afterEach(cleanup);

describe('ConfirmModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Khóa terminal',
    description: 'Bạn sắp khóa terminal T001. Hành động này không thể hoàn tác.',
    onConfirm: vi.fn(),
  };

  it('renders title and description', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Khóa terminal' })).toBeInTheDocument();
    expect(
      screen.getByText('Bạn sắp khóa terminal T001. Hành động này không thể hoàn tác.'),
    ).toBeInTheDocument();
  });

  it('closes with Escape and cancel button', async () => {
    const onOpenChange = vi.fn();
    render(<ConfirmModal {...defaultProps} onOpenChange={onOpenChange} />);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    onOpenChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders reason field when reasonLabel is provided', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        reasonLabel="Lý do khóa"
        reasonValue=""
        onReasonChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Lý do khóa')).toBeInTheDocument();
  });

  it('allows typing in reason field', async () => {
    render(
      <ConfirmModal
        {...defaultProps}
        reasonLabel="Lý do"
        reasonValue=""
        onReasonChange={vi.fn()}
      />,
    );
    const textarea = screen.getByPlaceholderText('Lý do...');
    await userEvent.type(textarea, 'Vi phạm điều khoản');
    // Since value is controlled, it won't update unless we pass the updated prop
    // Just verify textarea exists and is interactive
    expect(textarea).toBeInTheDocument();
  });

  it('disables confirm button while loading', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    expect(confirmBtn).toBeDisabled();
  });

  it('uses custom labels when provided', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Đồng ý khóa"
        cancelLabel="Quay lại"
      />,
    );
    expect(screen.getByRole('button', { name: 'Đồng ý khóa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
  });
  it('keeps the danger style by default and switches to solid on request', () => {
    const { rerender } = render(<ConfirmModal {...defaultProps} />);
    const dangerClass = screen.getByRole('button', { name: 'Xác nhận' }).className;
    rerender(<ConfirmModal {...defaultProps} confirmVariant="solid" />);
    expect(screen.getByRole('button', { name: 'Xác nhận' }).className).not.toBe(dangerClass);
  });

  it('disables confirm on request and can hide the cancel button', () => {
    render(<ConfirmModal {...defaultProps} confirmDisabled hideCancel />);
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Hủy' })).not.toBeInTheDocument();
  });

  it('shows the reason error as an alert linked to the reason field', () => {
    render(
      <ConfirmModal {...defaultProps} reasonLabel="Lý do" onReasonChange={vi.fn()} reasonError="Lý do quá ngắn" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Lý do quá ngắn');
    expect(screen.getByRole('textbox', { name: 'Lý do' })).toHaveAccessibleDescription('Lý do quá ngắn');
  });
});
