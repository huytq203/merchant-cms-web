// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InheritableField } from '../InheritableField';
import { SegmentedControl } from '../SegmentedControl';

afterEach(cleanup);

describe('SegmentedControl', () => {
  it('marks the selected option and reports a change', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl ariaLabel="Loại" value="a" onChange={onChange} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('InheritableField', () => {
  const field = (props: Partial<React.ComponentProps<typeof InheritableField>> = {}) => (
    <InheritableField label="Số điện thoại" sourceName="Master" inherited onInheritedChange={vi.fn()} {...props}>
      {(id) => <input id={id} aria-label="Giá trị riêng" />}
    </InheritableField>
  );

  it('explains where the value comes from instead of showing a value', () => {
    render(field());
    expect(screen.getByText(/sẽ lấy từ/)).toHaveTextContent('Số điện thoại sẽ lấy từ Master');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows the own-value control once "Nhập riêng" is chosen', async () => {
    const onInheritedChange = vi.fn();
    const { rerender } = render(field({ onInheritedChange }));
    await userEvent.click(screen.getByRole('button', { name: 'Nhập riêng' }));
    expect(onInheritedChange).toHaveBeenCalledWith(false);
    rerender(field({ inherited: false, onInheritedChange }));
    expect(screen.getByRole('textbox', { name: 'Giá trị riêng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dùng của Master' })).toHaveAttribute('aria-pressed', 'false');
  });
});
