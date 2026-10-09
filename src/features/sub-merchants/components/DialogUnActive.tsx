"use client";

import { ReasonDialog, unlockCopy, type ReasonDialogProps } from "./DialogActive";

export function DialogUnActive(props: ReasonDialogProps) {
  return <ReasonDialog copy={unlockCopy} {...props} />;
}
