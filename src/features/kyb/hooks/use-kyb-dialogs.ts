"use client";

import { useState } from "react";

export type KybDialog = "kyb" | "merchant";

export function useKybDialogs() {
  const [active, setActive] = useState<KybDialog | null>(null);
  return {
    active,
    open: (dialog: KybDialog) => setActive(dialog),
    close: () => setActive(null),
  };
}
