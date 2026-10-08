import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, list, prefetchDehydrated, redirect } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  list: vi.fn(),
  prefetchDehydrated: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({ listSubMerchants: list }));
vi.mock("@/lib/query/prefetch", () => ({
  prefetchDehydrated,
  unwrapOrRedirect: (result: { data: unknown }) => result.data,
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/sub-merchants/components/SubMerchantsContainer", () => ({ SubMerchantsContainer: () => null }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import Page from "../page";

describe("sub-merchants page access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prefetchDehydrated.mockResolvedValue({ mutations: [], queries: [] });
  });

  it("renders access denied without MANAGE_SUB_MERCHANT and does not load data", async () => {
    getServerSession.mockResolvedValue({ merchantIds: ["m"], permissions: ["VIEW_ORDER"] });
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toEqual(<AccessDenied />);
    expect(prefetchDehydrated).not.toHaveBeenCalled();
  });
  
  it("renders the page with MANAGE_SUB_MERCHANT", async () => {
    getServerSession.mockResolvedValue({ merchantIds: ["m"], permissions: ["MANAGE_SUB_MERCHANT"] });
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).not.toEqual(<AccessDenied />);
    expect(prefetchDehydrated).toHaveBeenCalled();
  });
});
