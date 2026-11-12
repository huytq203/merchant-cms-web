// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { registerPush, isPushConfigured } = vi.hoisted(() => ({ registerPush: vi.fn(), isPushConfigured: vi.fn() }));
vi.mock("../../register-push", () => ({ registerPush, isPushConfigured }));
import { PushOptIn } from "../PushOptIn";

beforeEach(() => {
  vi.clearAllMocks();
  isPushConfigured.mockReturnValue(true);
  vi.stubGlobal("Notification", Object.assign(function () {}, { permission: "default" }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("PushOptIn", () => {
  it("shows the button but asks nothing until it is clicked", async () => {
    render(<PushOptIn />);
    const button = await screen.findByRole("button", { name: "Bật thông báo trên trình duyệt" });
    expect(registerPush).not.toHaveBeenCalled();
    registerPush.mockResolvedValue("granted");
    await userEvent.click(button);
    expect(registerPush).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("button")).toBeNull());
  });

  it("hides when Firebase is not configured or the browser has no Notification", () => {
    isPushConfigured.mockReturnValue(false);
    const { container, rerender } = render(<PushOptIn />);
    expect(container).toBeEmptyDOMElement();
    isPushConfigured.mockReturnValue(true);
    vi.stubGlobal("Notification", undefined);
    rerender(<PushOptIn />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides once permission was already granted and explains a blocked browser", async () => {
    vi.stubGlobal("Notification", Object.assign(function () {}, { permission: "granted" }));
    const { container } = render(<PushOptIn />);
    expect(container).toBeEmptyDOMElement();
    cleanup();
    vi.stubGlobal("Notification", Object.assign(function () {}, { permission: "denied" }));
    render(<PushOptIn />);
    expect(await screen.findByText(/đang chặn thông báo/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explains a refusal in Vietnamese", async () => {
    registerPush.mockResolvedValue("denied");
    render(<PushOptIn />);
    await userEvent.click(await screen.findByRole("button", { name: "Bật thông báo trên trình duyệt" }));
    expect(await screen.findByText(/đang chặn thông báo/i)).toBeTruthy();
  });
});
