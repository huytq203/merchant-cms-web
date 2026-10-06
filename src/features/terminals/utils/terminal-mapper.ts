import type { TerminalFormValues } from "../schemas";
import { cascadeLockLabel, terminalStatusLabels, terminalTypeLabels } from "../constants/terminal.constants";
import type { TerminalRow } from "../types";

type LockState = Pick<TerminalRow, "status" | "lockSource">;

const optionalText = (value: string): string | undefined => value.trim() || undefined;

function terminalFields(values: TerminalFormValues) {
  return {
    name: values.name.trim(),
    terminalType: values.terminalType,
    ...(values.terminalType === "POS" ? { address: values.address.trim() } : {}),
    contactPerson: optionalText(values.contactPerson),
    inheritContactPhone: values.inheritContactPhone,
    ...(values.inheritContactPhone ? {} : { contactPhone: values.contactPhone.trim() }),
    note: optionalText(values.note),
  };
}

export const toCreateTerminalRequest = (values: TerminalFormValues) => ({
  subMerchantId: values.subMerchantId,
  ...terminalFields(values),
});

export const toUpdateTerminalRequest = (values: TerminalFormValues) => terminalFields(values);

export const canLockTerminal = (node: LockState): boolean => node.status === "ACTIVE";

export const canUnlockTerminal = (node: LockState): boolean =>
  node.status === "INACTIVE" && node.lockSource === "DIRECT";

export const terminalTypeLabel = (type: TerminalRow["terminalType"]): string => terminalTypeLabels[type];

export function terminalStatusLabel(node: LockState): string {
  if (node.status === "INACTIVE" && node.lockSource === "CASCADE") return cascadeLockLabel;
  return terminalStatusLabels[node.status];
}
