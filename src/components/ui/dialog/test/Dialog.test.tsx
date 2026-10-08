// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '../Dialog';

describe('Dialog', () => {
  it('gives the default close button a Vietnamese accessible name', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Tiêu đề</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
  });
});
