import type { BusinessCategory } from "./schemas";

export type BusinessCategoryOption = { value: string; label: string };

/** Nhãn hiển thị thống nhất toàn Portal: "<tên ngành> (MCC <mã>)". */
export function businessCategoryLabel(category: BusinessCategory): string {
  return `${category.name} (MCC ${category.mccCode})`;
}

/**
 * Hiển thị ngành nghề của hồ sơ đã lưu. BE lưu sẵn tên ngành chuẩn (businessCategory / businessField) cạnh mã MCC,
 * nên chỉ ghép lại; thiếu tên thì hiện riêng mã, thiếu cả hai thì trả chuỗi rỗng để nơi gọi hiện "Chưa có".
 */
export function formatBusinessCategory(name: string | null | undefined, mccCode: string | null | undefined): string {
  const label = name?.trim();
  const code = mccCode?.trim();
  if (label && code) return `${label} (MCC ${code})`;
  if (label) return label;
  return code ? `MCC ${code}` : "";
}

/**
 * Lựa chọn cho dropdown ngành nghề, theo thứ tự BE trả về. Giá trị đang lưu nhưng không còn trong danh mục (hồ sơ cũ
 * nhập tay trước khi có danh mục) vẫn được giữ làm một lựa chọn để không tự mất giá trị khi mở form; BE sẽ từ chối
 * (mã 4314) nếu người dùng lưu mã ngoài danh mục.
 */
export function businessCategoryOptions(
  categories: readonly BusinessCategory[] | undefined,
  current?: string | null,
): BusinessCategoryOption[] {
  const options = (categories ?? []).map((category) => ({ value: category.mccCode, label: businessCategoryLabel(category) }));
  return current && !options.some((option) => option.value === current)
    ? [...options, { value: current, label: `MCC ${current}` }]
    : options;
}
