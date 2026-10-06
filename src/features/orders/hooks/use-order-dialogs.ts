import { useState } from "react";
import type { Order } from "../types/types";

export type OrderDialogName = "detail" | "qr";

export function useOrderDialogs() {
  const [activeDialog, setActiveDialog] = useState<OrderDialogName | "create" | null>(null);
  const [target, setTarget] = useState<Order | null>(null);

  const openCreate = () => {
    setTarget(null);
    setActiveDialog("create");
  };
  const openFor = (name: OrderDialogName, order: Order) => {
    setTarget(order);
    setActiveDialog(name);
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };

  return { activeDialog, target, openCreate, openFor, close };
}

export type OrderDialogs = ReturnType<typeof useOrderDialogs>;
