import { useState, type FormEvent } from "react";
import { terminalFormSchema, type TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";
import { terminalFormInitialValues } from "../utils/terminal-form";

export type ChangeTerminalField = <K extends keyof TerminalFormValues>(
  field: K,
  value: TerminalFormValues[K],
) => void;

export type TerminalFormErrors = Partial<Record<keyof TerminalFormValues, string>>;

export function useTerminalForm(
  detail: TerminalDetail | null | undefined,
  onSubmit: (values: TerminalFormValues) => Promise<void>,
) {
  const [values, setValues] = useState<TerminalFormValues>(() => terminalFormInitialValues(detail));
  const [errors, setErrors] = useState<TerminalFormErrors>({});

  const change: ChangeTerminalField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const parsed = terminalFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: TerminalFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof TerminalFormValues;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    void onSubmit(parsed.data);
  };

  return { values, errors, change, submit };
}
