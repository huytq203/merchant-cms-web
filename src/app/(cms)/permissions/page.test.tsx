import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, list, prefetchDehydrated, redirect } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  list: vi.fn(),
  prefetchDehydrated: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ listPermissionGroups: list, listPermissionCatalog: vi.fn() }));
vi.mock("@/lib/query/prefetch", () => ({
  prefetchDehydrated,
  unwrapOrRedirect: (result: { data: unknown }) => result.data,
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/permission/components/PermissionGroupContainer", () => ({ PermissionGroupContainer: () => null }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import Page from "./page";

describe("permissions page access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prefetchDehydrated.mockResolvedValue({ mutations: [], queries: [] });
  });

  it("renders access denied without MANAGE_PERMISSION_GROUP and does not load data", async () => {
    getServerSession.mockResolvedValue({ merchantIds: ["m"], permissions: ["VIEW_ORDER"] });
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toEqual(<AccessDenied />);
    expect(prefetchDehydrated).not.toHaveBeenCalled();
  });
  
  it("renders access denied instead of throwing when the session has no merchant", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [], permissions: ["MANAGE_PERMISSION_GROUP"] });
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toEqual(<AccessDenied />);
  });

  it("renders the page with MANAGE_PERMISSION_GROUP", async () => {
    getServerSession.mockResolvedValue({ merchantIds: ["m"], permissions: ["MANAGE_PERMISSION_GROUP"] });
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).not.toEqual(<AccessDenied />);
    expect(prefetchDehydrated).toHaveBeenCalled();
  });
});
