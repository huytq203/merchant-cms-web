import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";

const { getServerSession, redirect } = vi.hoisted(() => ({ getServerSession: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({ redirect }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import AuditLogsPage from "../page";

const beUrl = "https://merchant.test/api/v1/merchant/audit-logs";
const logId = "e13ff927-d5d5-4966-ac07-502f2660487c";
const rawLog = {
  id: logId,
  entityName: "terminals",
  entityId: null,
  action: "LOCK",
  reason: null,
  occurredAt: "2026-10-05T12:00:00",
  actorType: "MERCHANT",
  actorLabel: "alice",
};

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue({ permissions: ["VIEW_AUDIT_LOG"], merchantIds: ["m"] });
});

function dehydratedState(page: ReactElement): DehydratedState {
  return (page as ReactElement<{ state: DehydratedState }>).props.state;
}

describe("audit logs page", () => {
  it("reads the merchant portal endpoint and hydrates the list with the portal DTO only", async () => {
    let requested: URL | undefined;
    mswServer.use(http.get(beUrl, ({ request }) => {
      requested = new URL(request.url);
      return HttpResponse.json({
        success: true,
        data: { content: [{ ...rawLog, ipAddress: "192.168.1.10" }], totalElements: 1, totalPages: 1, number: 0, size: 10 },
      });
    }));
    const page = await AuditLogsPage({ searchParams: Promise.resolve({}) }) as ReactElement;
    const serialized = JSON.stringify(dehydratedState(page));
    expect(serialized).toContain(logId);
    expect(serialized).toContain("alice");
    expect(serialized).not.toContain("192.168.1.10");
    expect(requested?.searchParams.has("sortBy")).toBe(false);
  });

  it("denies access without VIEW_AUDIT_LOG and does not call the BE", async () => {
    getServerSession.mockResolvedValue({ permissions: [], merchantIds: ["m"] });
    const result = await AuditLogsPage({ searchParams: Promise.resolve({}) });
    expect(result).toEqual(<AccessDenied />);
  });
});
