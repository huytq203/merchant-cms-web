import { useState } from 'react';
import type { ZodIssue } from 'zod';
import {
  permissionGroupFormSchema,
  type PermissionGroup,
  type PermissionGroupFormValues,
} from '../schemas/permission-group.schema';
import { toPermissionGroupCode } from '../utils/permission-group-code';
import { useSelectedPermissions } from './use-selected-permissions';

const INVALID_NAME_FOR_CODE =
  'Tên nhóm cần bắt đầu bằng chữ cái và có ít nhất 2 ký tự chữ hoặc số.';

/** The code is derived from the name, so a code problem is shown on the name field. */
function toFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (field === 'code') errors.name ??= INVALID_NAME_FOR_CODE;
    else errors[field] = issue.message;
  }
  return errors;
}

/** Form state for creating or editing a group. An existing group keeps its stored code. */
export function usePermissionForm(
  group: PermissionGroup | null | undefined,
  onSubmit: (values: PermissionGroupFormValues) => void,
) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [attempted, setAttempted] = useState(false);
  const permissions = useSelectedPermissions(group?.permissions ?? []);

  const code = group?.code ?? toPermissionGroupCode(name);
  const result = permissionGroupFormSchema.safeParse({
    code,
    name,
    description,
    permissions: permissions.selected,
  });
  const validation = attempted && !result.success ? toFieldErrors(result.error.issues) : {};

  const submit = () => {
    setAttempted(true);
    if (result.success) onSubmit(result.data);
  };

  return { code, name, description, validation, setName, setDescription, submit, ...permissions };
}

export type PermissionFormState = ReturnType<typeof usePermissionForm>;
