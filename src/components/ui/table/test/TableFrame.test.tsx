// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vitest';
import { ResultCard } from '@/components/page/ResultCard';
import { Table } from '../Table';

type Row = { name: string; code: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'code', header: 'Mã' },
];
const data = [{ name: 'Một', code: 'A' }];

afterEach(cleanup);

// data-framed / data-column-borders là hợp đồng trạng thái công khai của Table:
// không có role hay label ngữ nghĩa nào mô tả việc bảng có khung hoặc kẻ dọc.
const frameOf = () => screen.getByRole('table').closest('[data-framed]');

describe('Table frame', () => {
  it('has its own frame when standing alone', () => {
    render(<Table columns={columns} data={data} pagination={false} />);

    expect(frameOf()).toHaveAttribute('data-framed', 'true');
  });

  it('drops its own frame inside ResultCard', () => {
    render(
      <ResultCard>
        <Table columns={columns} data={data} pagination={false} />
      </ResultCard>,
    );

    expect(frameOf()).toHaveAttribute('data-framed', 'false');
  });

  it('lets the framed prop override the surrounding card', () => {
    render(
      <ResultCard>
        <Table columns={columns} data={data} pagination={false} framed />
      </ResultCard>,
    );

    expect(frameOf()).toHaveAttribute('data-framed', 'true');
  });
});

describe('Table column borders', () => {
  it('has no vertical column dividers by default', () => {
    render(<Table columns={columns} data={data} pagination={false} />);

    expect(screen.getByRole('table')).not.toHaveAttribute('data-column-borders');
  });

  it('enables vertical column dividers with columnBorders', () => {
    render(<Table columns={columns} data={data} pagination={false} columnBorders />);

    expect(screen.getByRole('table')).toHaveAttribute('data-column-borders', 'true');
  });
});
