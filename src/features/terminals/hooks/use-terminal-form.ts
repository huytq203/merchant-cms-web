import { useState, type FormEvent } from "react";
import { terminalFormSchema, type TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";
import { terminalFormInitialValues } from "../utils/terminal-form";

export type ChangeTerminalField = <K extends keyof TerminalFormValues>(
  field: K,
  value: TerminalFormValues[K],
) => void;

export function useTerminalForm(
  detail: TerminalDetail | null | undefined,
  onSubmit: (values: TerminalFormValues) => Promise<void>,
) {
  const [values, setValues] = useState<TerminalFormValues>(() => terminalFormInitialValues(detail));
  const [fieldError, setFieldError] = useState<string | null>(null);

  const change: ChangeTerminalField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldError(null);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = terminalFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }
    void onSubmit(parsed.data);
  };

  return { values, fieldError, change, submit };
}
