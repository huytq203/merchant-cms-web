import { useState, type FormEvent } from "react";
import type { TerminalListFilter } from "../types";

export type TerminalFilterValues = Pick<TerminalListFilter, "name" | "status" | "subMerchantId">;

export function useTerminalFilterForm(
  initial: TerminalFilterValues,
  onSearch: (values: TerminalFilterValues) => void,
) {
  const [name, setName] = useState(initial.name ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch({
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(status ? { status: status as TerminalFilterValues["status"] } : {}),
      ...(subMerchantId ? { subMerchantId } : {}),
    });
  };
  const clear = () => {
    setName("");
    setStatus("");
    setSubMerchantId("");
    onSearch({});
  };

  return { name, status, subMerchantId, setName, setStatus, setSubMerchantId, submit, clear };
}
