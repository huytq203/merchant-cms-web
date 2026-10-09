import type { SubMerchantListFilter, SubMerchantRow } from "../types";

type Filters = Pick<SubMerchantListFilter, "code" | "name" | "status">;

export function hasSubMerchantFilter(filter: Filters): boolean {
  return Boolean(filter.code || filter.name || filter.status);
}

/** Lower case with accents removed, so "dien" finds "Điện" and "S001" finds "s001". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}

/**
 * The merchant portal list only paginates, so the code, name and status filters are applied here
 * to what the BE returned: code and name match a part of the value, status matches exactly.
 */
export function matchesSubMerchantFilter(row: Pick<SubMerchantRow, "code" | "name" | "status">, filter: Filters): boolean {
  if (filter.status && row.status !== filter.status) return false;
  if (filter.code && !fold(row.code).includes(fold(filter.code))) return false;
  if (filter.name && !fold(row.name).includes(fold(filter.name))) return false;
  return true;
}
