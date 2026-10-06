// Giữ lại, chưa dùng: thẻ lọc sub-merchants đang ẩn, sẽ dùng lại khi BE hỗ trợ lọc keyword/status.
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import type { SubMerchantFilterValues } from '../schemas';

type Props = {
  onSearch: (values: SubMerchantFilterValues) => void;
  defaultValues?: SubMerchantFilterValues;
};

export function SubMerchantFilters({ onSearch, defaultValues }: Props) {
  const [keyword, setKeyword] = useState(defaultValues?.keyword ?? '');
  const [status, setStatus] = useState<SubMerchantFilterValues['status'] | ''>(defaultValues?.status ?? '');

  return <form onSubmit={(event) => {
    event.preventDefault();
    onSearch({ keyword: keyword.trim(), status: status || undefined });
  }}>
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Tên / Mã sub-merchant"
        placeholder="Nhập tên hoặc mã sub-merchant"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        maxLength={100}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor="sub-merchant-status" className="text-sm font-medium text-foreground">Trạng thái</label>
        <Select
          id="sub-merchant-status"
          placeholder="Tất cả trạng thái"
          options={[
            { value: 'ACTIVE', label: 'Đang hoạt động' },
            { value: 'INACTIVE', label: 'Đã khóa' },
            { value: 'TERMINATED', label: 'Đã đóng' },
          ]}
          value={status}
          onChange={(value) => setStatus(value as typeof status)}
          clearable={false}
        />
      </div>
    </div>
    <div className="mt-3 flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={() => { setKeyword(''); setStatus(''); onSearch({}); }}>Xóa bộ lọc</Button>
      <Button type="submit" variant="solid">Tìm kiếm</Button>
    </div>
  </form>;
}
