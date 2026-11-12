// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDetailParam } from "../use-detail-param";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/order",
  useSearchParams: () => new URLSearchParams(search),
}));

const id = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  replace.mockClear();
  search = "";
});

describe("useDetailParam", () => {
  it("reads a UUID from ?detail=", () => {
    search = `detail=${id}`;
    expect(renderHook(() => useDetailParam()).result.current.detailId).toBe(id);
  });

  it("treats a missing or non-UUID value as null", () => {
    expect(renderHook(() => useDetailParam()).result.current.detailId).toBeNull();
    search = "detail=../../etc/passwd";
    expect(renderHook(() => useDetailParam()).result.current.detailId).toBeNull();
    search = "detail=123";
    expect(renderHook(() => useDetailParam()).result.current.detailId).toBeNull();
  });

  it("opens a detail with router.replace and keeps the other filters", () => {
    search = "status=ACTIVE&page=2";
    renderHook(() => useDetailParam()).result.current.openDetail(id);
    expect(replace).toHaveBeenCalledWith(`/order?status=ACTIVE&page=2&detail=${id}`);
  });

  it("closes by removing only detail", () => {
    search = `status=ACTIVE&detail=${id}`;
    renderHook(() => useDetailParam()).result.current.closeDetail();
    expect(replace).toHaveBeenCalledWith("/order?status=ACTIVE");
  });

  it("drops the query string when detail was the only parameter", () => {
    search = `detail=${id}`;
    renderHook(() => useDetailParam()).result.current.closeDetail();
    expect(replace).toHaveBeenCalledWith("/order");
  });

  it("does nothing on close when the URL has no detail", () => {
    search = "status=ACTIVE";
    renderHook(() => useDetailParam()).result.current.closeDetail();
    expect(replace).not.toHaveBeenCalled();
  });
});
