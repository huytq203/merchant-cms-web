import { format } from 'date-fns';
import { permissionLabel } from '../constants/permission-labels';
import type { PermissionCatalogItem } from '../schemas/permission-group.schema';
import { groupPermissionsByCategory } from './permission-group-mapper';

export interface PermissionCoverageRow {
  category: string;
  label: string;
  total: number;
  granted: string[];
}

export interface PermissionCoverage {
  total: number;
  granted: number;
  rows: PermissionCoverageRow[];
  emptyLabels: string[];
}

/** Total comes from the live catalog; categories without granted permissions are listed separately. */
export function buildPermissionCoverage(catalog: PermissionCatalogItem[], grantedCodes: string[]): PermissionCoverage {
  const granted = new Set(grantedCodes);
  const known = new Set(catalog.map((item) => item.code));
  const rows: PermissionCoverageRow[] = groupPermissionsByCategory(catalog).map((group) => ({
    category: group.category,
    label: group.label,
    total: group.permissions.length,
    granted: group.permissions.filter((item) => granted.has(item.code)).map((item) => permissionLabel(item.code)),
  }));
  const unknown = grantedCodes.filter((code) => !known.has(code));
  if (unknown.length > 0) {
    rows.push({ category: 'UNKNOWN', label: 'Khác', total: unknown.length, granted: unknown.map(permissionLabel) });
  }
  return {
    total: catalog.length,
    granted: grantedCodes.length,
    rows: rows.filter((row) => row.granted.length > 0),
    emptyLabels: rows.filter((row) => row.granted.length === 0).map((row) => row.label),
  };
}

export function getInitials(name: string): string {
  const letters = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.length > 0 ? letters.join('') : '?';
}

export function formatGroupDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : format(date, 'HH:mm, dd/MM/yyyy');
}
