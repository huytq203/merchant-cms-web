// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('uses the standard disabled opacity token for every variant', () => {
    render(<Button disabled>Không khả dụng</Button>);

    expect(screen.getByRole('button', { name: 'Không khả dụng' })).toHaveClass('disabled:opacity-50');
  });
});
