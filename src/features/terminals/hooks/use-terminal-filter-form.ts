import { useState } from "react";
import type { TerminalListFilter } from "../types";

export type TerminalFilterValues = Pick<TerminalListFilter, "name" | "status" | "subMerchantId" | "terminalType">;

export function useTerminalFilterForm(
  initial: TerminalFilterValues,
  onSearch: (values: TerminalFilterValues) => void,
) {
  const [name, setName] = useState(initial.name ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");
  const [terminalType, setTerminalType] = useState(initial.terminalType ?? "");

  const submit = () => {
    onSearch({
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(status ? { status: status as TerminalFilterValues["status"] } : {}),
      ...(subMerchantId ? { subMerchantId } : {}),
      ...(terminalType ? { terminalType: terminalType as TerminalFilterValues["terminalType"] } : {}),
    });
  };
  const clear = () => {
    setName("");
    setStatus("");
    setSubMerchantId("");
    setTerminalType("");
    onSearch({});
  };

  return { name, status, subMerchantId, terminalType, setName, setStatus, setSubMerchantId, setTerminalType, submit, clear };
}
