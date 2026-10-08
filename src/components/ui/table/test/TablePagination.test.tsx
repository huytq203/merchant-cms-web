// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';
import { Table } from '../Table';

type Row = { name: string };

const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Tên' }];
const data = [{ name: 'Một' }, { name: 'Hai' }, { name: 'Ba' }];

describe('TablePagination', () => {
  it('renders Vietnamese default pagination labels', () => {
    render(<Table columns={columns} data={data} pagination={{ pageSize: 2 }} />);

    expect(screen.getByText(/Hiển thị/)).toHaveTextContent('Hiển thị 1–2 / 3 kết quả');
    expect(screen.getByRole('option', { name: '5 / trang' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang đầu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang cuối' })).toBeInTheDocument();
  });
});
