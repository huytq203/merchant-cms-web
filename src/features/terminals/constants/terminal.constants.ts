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
  INACTIVE: "Đã khóa",
  TERMINATED: "Đã đóng",
};

export const terminalStatusOptions = (Object.keys(terminalStatusLabels) as TerminalStatus[]).map((value) => ({
  value,
  label: terminalStatusLabels[value],
}));

export const cascadeLockLabel = "Khóa theo Master";
