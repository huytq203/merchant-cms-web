import { useState } from "react";
import type { BankAccount } from "../types";

export type BankDialogName = "create" | "edit" | "detail" | "delete" | "default";

export function useBankAccountDialogs() {
  const [active, setActive] = useState<BankDialogName | null>(null);
  const [target, setTarget] = useState<BankAccount | null>(null);

  const openCreate = () => {
    setTarget(null);
    setActive("create");
  };
  const openFor = (name: Exclude<BankDialogName, "create">, account: BankAccount) => {
    setTarget(account);
    setActive(name);
  };
  const close = () => {
    setActive(null);
    setTarget(null);
  };

  return { active, target, openCreate, openFor, close };
}
