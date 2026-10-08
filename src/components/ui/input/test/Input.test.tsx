// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('uses Vietnamese password visibility labels', async () => {
    const user = userEvent.setup();
    render(<Input type="password" label="Mật khẩu" />);

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));

    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toBeInTheDocument();
  });
});
