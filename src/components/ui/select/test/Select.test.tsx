// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select } from '../Select';

describe('Select', () => {
  it('renders Vietnamese defaults for an empty option list', async () => {
    const user = userEvent.setup();
    render(<Select options={[]} />);

    expect(screen.getByText('Chọn...')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Không tìm thấy')).toBeInTheDocument();
  });

  it('uses a Vietnamese accessible name for the clear control', () => {
    render(<Select defaultValue="active" options={[{ label: 'Đang hoạt động', value: 'active' }]} />);

    expect(screen.getByRole('button', { name: 'Bỏ chọn' })).toBeInTheDocument();
  });

  it('connects its label to the select trigger', () => {
    render(<Select id="status" label="Trạng thái" options={[]} />);

    expect(screen.getByRole('combobox', { name: 'Trạng thái' })).toHaveAttribute('id', 'status');
  });
});
