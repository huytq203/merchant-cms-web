// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailModal, StatusBadge, Badge, InheritedHint } from '../DetailModal';
import { DetailSection, DetailList, DetailItem } from '../DetailModal';

afterEach(cleanup);

describe('DetailModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    header: {
      monogramInitials: 'NH',
      title: 'nhinty12',
      code: 'MC000001-S002',
      statusBadge: <StatusBadge tone="success">Đang hoạt động</StatusBadge>,
    },
  };

  it('renders the header with monogram, title, code and status', () => {
    render(<DetailModal {...defaultProps} />);
    expect(screen.getByText('nhinty12')).toBeInTheDocument();
    expect(screen.getByText('MC000001-S002')).toBeInTheDocument();
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
    expect(screen.getByLabelText(/Sao chép mã MC000001-S002/)).toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const onOpenChange = vi.fn();
    render(<DetailModal {...defaultProps} onOpenChange={onOpenChange} />);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('closes when clicking the footer close button', async () => {
    const onOpenChange = vi.fn();
    render(
      <DetailModal {...defaultProps} onOpenChange={onOpenChange} />,
    );
    const allCloseButtons = screen.getAllByRole('button', { name: 'Đóng' });
    const footerCloseButton = allCloseButtons[allCloseButtons.length - 1] as HTMLButtonElement;
    await userEvent.click(footerCloseButton);
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('shows the edit button when onEdit is provided', async () => {
    const onEdit = vi.fn();
    render(<DetailModal {...defaultProps} editLabel="Sửa" onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: 'Sửa' });
    await userEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();
  });

  it('does not show the edit button when onEdit is not provided', () => {
    render(<DetailModal {...defaultProps} editLabel="Sửa" />);
    expect(screen.queryByRole('button', { name: 'Sửa' })).not.toBeInTheDocument();
  });

  it('renders sections with icon, title and content', () => {
    render(
      <DetailModal
        {...defaultProps}
        sections={
          <>
            <DetailSection title="Thông tin">
              <DetailList>
                <DetailItem label="Tên">Test Name</DetailItem>
              </DetailList>
            </DetailSection>
          </>
        }
      />,
    );
    expect(screen.getByText('Thông tin')).toBeInTheDocument();
    expect(screen.getByText('Tên')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });

  it('displays timestamps when provided', () => {
    render(
      <DetailModal
        {...defaultProps}
        createdAt="10:30, 01/10/2026"
        updatedAt="14:45, 01/10/2026"
      />,
    );
    expect(screen.getByText(/Tạo 10:30, 01\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Cập nhật 14:45, 01\/10\/2026/)).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders with correct tone colors', () => {
    const { rerender } = render(<StatusBadge tone="success">Thành công</StatusBadge>);
    const badge = screen.getByText('Thành công');
    expect(badge).toHaveClass('text-success', 'bg-success-soft');

    rerender(<StatusBadge tone="danger">Lỗi</StatusBadge>);
    const errorBadge = screen.getByText('Lỗi');
    expect(errorBadge).toHaveClass('text-danger', 'bg-danger-soft');
  });
});

describe('InheritedHint', () => {
  it('shows the inherited indicator with tooltip', () => {
    render(<InheritedHint />);
    const hint = screen.getByText('Từ Master');
    expect(hint).toHaveClass('text-info');
    expect(hint).toHaveAttribute('title');
  });
});

describe('Badge', () => {
  it('renders with action tone by default', () => {
    render(<Badge>Mặc định</Badge>);
    const badge = screen.getByText('Mặc định');
    expect(badge).toHaveClass('bg-action');
  });
});
