import { useState } from 'react';

/**
 * Keeps the last non-empty value so dialog content does not go blank
 * while the closing animation is still running (e.g. "Xóa nhóm CSKH?" must not become "Xóa nhóm ?").
 * The dialog unmounts its content once closed, so a stale value is never visible afterwards.
 */
export function usePreservedValue<T>(value: T | null | undefined): T | null {
  const [preserved, setPreserved] = useState<T | null>(value ?? null);
  if (value !== null && value !== undefined && value !== preserved) {
    setPreserved(value);
  }
  return value ?? preserved;
}
