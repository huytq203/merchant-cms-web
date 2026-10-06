import type { TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";

export const blankTerminalForm: TerminalFormValues = {
  subMerchantId: "",
  name: "",
  terminalType: "POS",
  address: "",
  contactPerson: "",
  inheritContactPhone: true,
  contactPhone: "",
  note: "",
};

export function terminalFormInitialValues(detail?: TerminalDetail | null): TerminalFormValues {
  if (!detail) return blankTerminalForm;
  return {
    subMerchantId: detail.subMerchantId,
    name: detail.name,
    terminalType: detail.terminalType,
    address: detail.address ?? "",
    contactPerson: detail.contactPerson ?? "",
    inheritContactPhone: detail.contactPhone?.inherited ?? true,
    contactPhone: detail.contactPhone?.inherited ? "" : detail.contactPhone?.value ?? "",
    note: detail.note ?? "",
  };
}
