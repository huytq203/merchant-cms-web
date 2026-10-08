// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const { getSessionState, redirect } = vi.hoisted(() => ({ getSessionState: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSessionState }));
vi.mock("next/navigation", () => ({ redirect, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(cms)/_layout/CmsShell", () => ({ CmsShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import { SessionGate } from "@/app/(cms)/_layout/SessionGate";

beforeEach(() => { getSessionState.mockReset(); redirect.mockReset(); redirect.mockImplementation(() => { throw new Error("REDIRECT"); }); });

it("redirects an unauthenticated visitor", async () => {
  getSessionState.mockResolvedValue({ kind: "unauthenticated" });
  await expect(SessionGate({ children: <span>Content</span> })).rejects.toThrow("REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/api/v1/admin/auth/session-expired");
});
it("shows retry UI while the backend is unavailable", async () => {
  getSessionState.mockResolvedValue({ kind: "unavailable" });
  render(await SessionGate({ children: <span>Content</span> }));
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
});
it("renders the shell for an active user", async () => {
  getSessionState.mockResolvedValue({ kind: "authenticated", user: { userId: "u", username: "Merchant", status: "ACTIVE", merchantIds: [], subMerchantIds: [], permissions: [], authorizationVersion: 1 } });
  render(await SessionGate({ children: <span>Content</span> }));
  expect(screen.getByText("Content")).toBeInTheDocument();
});
