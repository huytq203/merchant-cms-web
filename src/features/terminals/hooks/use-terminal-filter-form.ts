import { useState } from "react";
import type { TerminalListFilter } from "../types";

export type TerminalFilterValues = Pick<TerminalListFilter, "name" | "status" | "subMerchantIds" | "terminalType">;

export function useTerminalFilterForm(
  initial: TerminalFilterValues,
  onSearch: (values: TerminalFilterValues) => void,
) {
  const [name, setName] = useState(initial.name ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [subMerchantIds, setSubMerchantIds] = useState<string[]>(initial.subMerchantIds ?? []);
  const [terminalType, setTerminalType] = useState(initial.terminalType ?? "");

  const submit = () => {
    onSearch({
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(status ? { status: status as TerminalFilterValues["status"] } : {}),
      ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
      ...(terminalType ? { terminalType: terminalType as TerminalFilterValues["terminalType"] } : {}),
    });
  };
  const clear = () => {
    setName("");
    setStatus("");
    setSubMerchantIds([]);
    setTerminalType("");
    onSearch({});
  };

  return { name, status, subMerchantIds, terminalType, setName, setStatus, setSubMerchantIds, setTerminalType, submit, clear };
}
