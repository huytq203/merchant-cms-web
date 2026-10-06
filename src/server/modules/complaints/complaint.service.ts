import "server-only";

import type { BeResult } from "@/lib/be/client";
import { resolveModuleSource, unsupportedResult } from "@/lib/be/api-mode";
import { ok } from "@/lib/http/result";
import type { Complaint, ComplaintListFilter, ComplaintListResult } from "@/features/complaints/types/types";
import { COMPLAINT_FIXTURES } from "./complaint.fixtures";

export type ComplaintListQuery = ComplaintListFilter & { merchantId: string };

function includesText(value: string | null, search: string | undefined): boolean {
  return !search || (value ?? "").toLowerCase().includes(search.toLowerCase());
}

function isWithinRange(row: Complaint, filter: ComplaintListFilter): boolean {
  const createdAt = Date.parse(row.createdAt);
  const from = filter.createdFromDate ? Date.parse(filter.createdFromDate) : -Infinity;
  const to = filter.createdToDate ? Date.parse(filter.createdToDate) : Infinity;
  return createdAt >= from && createdAt <= to;
}

function matchesFilter(row: Complaint, filter: ComplaintListFilter): boolean {
  return (
    (includesText(row.ticketCode, filter.keyword) || includesText(row.transactionCode, filter.keyword)) &&
    (!filter.status || row.status === filter.status) &&
    (!filter.source || row.source === filter.source) &&
    isWithinRange(row, filter)
  );
}

function queryFixtures(filter: ComplaintListFilter): ComplaintListResult {
  const matched = COMPLAINT_FIXTURES.filter((row) => matchesFilter(row, filter));
  const start = (filter.page - 1) * filter.pageSize;
  return { rows: matched.slice(start, start + filter.pageSize), total: matched.length };
}

/** The BE has no complaint API yet: serves fixtures in development, otherwise NOT_IMPLEMENTED. */
export async function listComplaints(query: ComplaintListQuery): Promise<BeResult<ComplaintListResult>> {
  if (resolveModuleSource("complaints") !== "fixture") return unsupportedResult();
  return ok(queryFixtures(query));
}
