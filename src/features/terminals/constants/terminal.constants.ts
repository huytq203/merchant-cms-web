import type { TerminalRow } from "../types";

/** Route Handler root called by the browser through `apiClient`. */
export const terminalApiRoot = "/v1/admin/terminals";

type TerminalType = TerminalRow["terminalType"];
type TerminalStatus = TerminalRow["status"];

export const terminalTypeLabels: Record<TerminalType, string> = {
  POS: "POS",
  ONLINE: "Online",
  QR: "QR",
};

export const terminalTypeOptions = (Object.keys(terminalTypeLabels) as TerminalType[]).map((value) => ({
  value,
  label: terminalTypeLabels[value],
}));

export const terminalStatusLabels: Record<TerminalStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Bị khóa",
  TERMINATED: "Đã đóng",
};

export const terminalStatusOptions = (Object.keys(terminalStatusLabels) as TerminalStatus[]).map((value) => ({
  value,
  label: terminalStatusLabels[value],
}));

/** Nhãn khóa giống Admin CMS: phân biệt khóa trực tiếp trên Terminal với khóa lan từ cấp trên (BE chưa trả rõ Sub hay Master). */
export const directLockLabel = "Bị khóa · Khóa riêng";
export const cascadeLockLabel = "Bị khóa · Khóa theo cấp trên";

/** 34 tỉnh/thành sau sáp nhập (07/2025); chép đúng chuỗi và thứ tự của BE, BE từ chối giá trị ngoài danh sách. */
export const terminalProvinces = [
  "Hà Nội", "Huế", "Hải Phòng", "Đà Nẵng", "TP. Hồ Chí Minh", "Cần Thơ",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Điện Biên", "Đắk Lắk", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh",
  "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
] as const;

export const terminalProvinceOptions = terminalProvinces.map((value) => ({ value: value as string, label: value as string }));

/** Địa chỉ điểm bán tối đa 200 ký tự (BE, C-T1). */
export const TERMINAL_ADDRESS_MAX = 200;
