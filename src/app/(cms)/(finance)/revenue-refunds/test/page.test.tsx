import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { orderId, pendingRefund } from "@/features/revenue-refunds/test/fixtures";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import RevenueRefundsPage from "../page";

const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_REFUND"] };
let query: URLSearchParams | undefined;

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  query = undefined;
  mswServer.use(http.get("https://merchant.test/api/v1/merchant/revenue-refunds", ({ request }) => {
    query = new URL(request.url).searchParams;
    return HttpResponse.json({ success: true, data: [pendingRefund] });
  }));
});

describe("revenue refunds page", () => {
  it("prefetches the refunds of the order named in the URL", async () => {
    const page = await RevenueRefundsPage({ searchParams: Promise.resolve({ orderId, status: "PENDING_APPROVAL" }) }) as ReactElement<{ state: DehydratedState }>;
    expect(query?.get("orderId")).toBe(orderId);
    expect(query?.get("status")).toBe("PENDING_APPROVAL");
    expect(JSON.stringify(page.props.state)).toContain("MRF7A21C3D8E4B90F11");
  });

  it("denies access without VIEW_REFUND and does not call the BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_REFUND"] });
    expect(await RevenueRefundsPage({ searchParams: Promise.resolve({}) })).toEqual(<AccessDenied />);
    expect(query).toBeUndefined();
  });
});
