import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { rowFixture, subId, totalsFixture } from "@/features/settlement-items/test/fixtures";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import SettlementItemsPage from "../page";

const be = "https://merchant.test/api/v1/merchant";
const session = { merchantIds: [], subMerchantIds: [subId], permissions: ["VIEW_BALANCE"] };
let listQuery: URLSearchParams | undefined;

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  listQuery = undefined;
  mswServer.use(
    http.get(`${be}/settlement-items`, ({ request }) => {
      listQuery = new URL(request.url).searchParams;
      return HttpResponse.json({ success: true, data: { content: [rowFixture], totalElements: 1, totalPages: 1, number: 0, size: 20 } });
    }),
    http.get(`${be}/settlement-items/totals`, () => HttpResponse.json({ success: true, data: totalsFixture })),
  );
});

describe("settlement items page", () => {
  it("prefetches the session's first Sub over the requested range", async () => {
    const page = await SettlementItemsPage({ searchParams: Promise.resolve({ paidFrom: "2026-10-01", paidTo: "2026-10-05" }) }) as ReactElement<{ state: DehydratedState }>;
    expect(listQuery?.get("subMerchantId")).toBe(subId);
    expect(listQuery?.get("paidFrom")).toBe("2026-10-01");
    expect(listQuery?.get("paidTo")).toBe("2026-10-05");
    expect(JSON.stringify(page.props.state)).toContain("MO20261013000123");
  });

  it("denies access without VIEW_BALANCE and does not call the BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_ORDER"] });
    expect(await SettlementItemsPage({ searchParams: Promise.resolve({}) })).toEqual(<AccessDenied />);
    expect(listQuery).toBeUndefined();
  });

  it("does not call the BE when the session has no Sub", async () => {
    getServerSession.mockResolvedValue({ ...session, subMerchantIds: [] });
    await SettlementItemsPage({ searchParams: Promise.resolve({}) });
    expect(listQuery).toBeUndefined();
  });
});
