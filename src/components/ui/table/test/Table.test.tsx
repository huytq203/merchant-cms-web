// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { afterEach as afterEachTest, describe, expect, it } from 'vitest';
import { createIndexColumn } from '@/components/page/IndexColumn';
import { Table } from '../Table';

type Row = { name: string };

const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Tên' }];

afterEachTest(cleanup);

describe('Table', () => {
  it('renders the Vietnamese empty-state default', () => {
    render(<Table columns={columns} data={[]} pagination={false} />);

    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
  });

  it('shrinks the actions column to its content', () => {
    const compactColumns: ColumnDef<Row>[] = [
      { id: 'index', header: '#', cell: ({ row }) => row.index + 1 },
      { accessorKey: 'name', header: 'Tên' },
      { id: 'actions', header: 'Thao tác', cell: () => 'Xem' },
    ];
    render(<Table columns={compactColumns} data={[{ name: 'Sale' }]} pagination={false} />);

    const actionHeader = screen.getByRole('columnheader', { name: 'Thao tác' });
    expect(actionHeader).toHaveStyle({ width: '1%', whiteSpace: 'nowrap' });
    for (const header of screen.getAllByRole('columnheader', { name: 'Tên' })) {
      expect(header).not.toHaveStyle({ width: '1%' });
    }
    const cells = within(screen.getByRole('row', { name: /Sale/ })).getAllByRole('cell');
    expect(cells[2]).toHaveStyle({ width: '1%', whiteSpace: 'nowrap' });
  });

  it('uses the width declared by the reusable index column', () => {
    const indexColumn = createIndexColumn<Row>({ page: 1, pageSize: 10 });
    const columnsWithIndex: ColumnDef<Row>[] = [
      indexColumn,
      { accessorKey: 'name', header: 'Tên' },
    ];

    render(<Table columns={columnsWithIndex} data={[{ name: 'Sale' }]} pagination={false} />);

    expect(indexColumn.size).toBeDefined();
    const declaredWidth = `${indexColumn.size}px`;
    expect(screen.getByRole('columnheader', { name: '#' })).toHaveStyle({ width: declaredWidth });
    expect(within(screen.getByRole('row', { name: /Sale/ })).getAllByRole('cell')[0]).toHaveStyle({ width: declaredWidth });
  });
});
