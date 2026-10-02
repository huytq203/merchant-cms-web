import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { cn } from "@/lib/utils/cn";
import { mswServer } from "@/test/msw";

describe("test harness", () => {
  it("resolves the @ alias", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("stubs the server-only package", async () => {
    await expect(import("server-only")).resolves.toBeDefined();
  });

  it("intercepts fetch with msw", async () => {
    mswServer.use(
      http.get("https://example.test/ping", () => HttpResponse.json({ ok: true })),
    );
    const response = await fetch("https://example.test/ping");
    expect(await response.json()).toEqual({ ok: true });
  });
});
