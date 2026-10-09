/** Common merchant category codes; any other code is kept as typed on an existing dossier. */
export const MCC_OPTIONS = [
  { value: "5812", label: "5812 · Nhà hàng, ăn uống" },
  { value: "5814", label: "5814 · Quán ăn nhanh, cà phê" },
  { value: "5411", label: "5411 · Siêu thị, tạp hóa" },
  { value: "5999", label: "5999 · Bán lẻ khác" },
  { value: "5311", label: "5311 · Cửa hàng bách hóa" },
  { value: "7372", label: "7372 · Phần mềm, dịch vụ số" },
  { value: "4722", label: "4722 · Du lịch, đặt vé" },
  { value: "8299", label: "8299 · Giáo dục, đào tạo" },
] as const;

export function mccOptionsFor(current: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [...MCC_OPTIONS];
  return current && !options.some((option) => option.value === current)
    ? [...options, { value: current, label: current }]
    : options;
}
