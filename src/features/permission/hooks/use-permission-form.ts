import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  permissionGroupFormSchema,
  type PermissionGroup,
  type PermissionGroupFormValues,
} from '../schemas/permission-group.schema';

export function usePermissionForm(
  group: PermissionGroup | null | undefined,
  onSubmit: (values: PermissionGroupFormValues) => void,
) {
  const [code, setCode] = useState(group?.code ?? '');
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [selected, setSelected] = useState(group?.permissions ?? []);
  const [validation, setValidation] = useState<Record<string, string>>({});

  const toggle = (permission: string) => {
    setSelected((current) => current.includes(permission)
      ? current.filter((value) => value !== permission)
      : [...current, permission]);
  };
  const selectAll = (codes: string[]) => {
    setSelected((current) => codes.every((value) => current.includes(value))
      ? current.filter((value) => !codes.includes(value))
      : [...new Set([...current, ...codes])]);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = permissionGroupFormSchema.safeParse({
      code,
      name,
      description,
      permissions: selected,
    });
    if (!result.success) {
      setValidation(Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ));
      return;
    }
    setValidation({});
    onSubmit(result.data);
  };

  return {
    code,
    name,
    description,
    selected,
    validation,
    setCode,
    setName,
    setDescription,
    toggle,
    selectAll,
    submit,
  };
}
