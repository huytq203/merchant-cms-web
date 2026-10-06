"use client";

import { useState } from "react";
import type { MerchantUser } from "../schemas/user.schema";

export type UserDialogsState = ReturnType<typeof useUserDialogs>;

export type UserDialog = "create" | "edit" | "detail" | "lock" | "unlock" | "reset" | "scope" | null;

export function useUserDialogs() {
  const [activeDialog, setActiveDialog] = useState<UserDialog>(null);
  const [target, setTarget] = useState<MerchantUser | null>(null);
  const openCreate = () => {
    setTarget(null);
    setActiveDialog("create");
  };
  const openFor = (dialog: Exclude<UserDialog, "create" | null>, user: MerchantUser) => {
    setTarget(user);
    setActiveDialog(dialog);
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };
  return { activeDialog, target, openCreate, openFor, close };
}
