import { useState } from 'react';

/** Selected permission codes plus the two ways the picker changes them. */
export function useSelectedPermissions(initial: string[]) {
  const [selected, setSelected] = useState(initial);

  const toggle = (code: string) => {
    setSelected((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    );
  };

  /** Selects every code of a category, or clears the category when all are already selected. */
  const selectAll = (codes: string[]) => {
    setSelected((current) =>
      codes.every((value) => current.includes(value))
        ? current.filter((value) => !codes.includes(value))
        : [...new Set([...current, ...codes])],
    );
  };

  return { selected, toggle, selectAll };
}
